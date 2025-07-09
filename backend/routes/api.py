from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import os
import tempfile
import uuid
from typing import List
import asyncio
from datetime import datetime
from bson import ObjectId
from advance_rag import (
    convert_pdf_to_images, 
    ocr_with_gemini, 
    summarize_and_extract_keywords, 
    chunk_extracted_text, 
    create_vector_db,
    load_model,
    hybrid_retrieve,
    qa_template,
    create_workflow,
    AsyncMongoDBSaver,
)
from qdrant_client import QdrantClient
from backend.config import settings
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, AIMessage
from backend.schemas.chat import ChatRequest, ChatResponse
from backend.utils.auth import get_current_user
from backend.database import sessions_collection
from backend.schemas.session import SessionRequest, SessionResponse
from uuid import uuid4, UUID
import re



router = APIRouter()

def convert_mongo_doc(doc):
    """Convert MongoDB document to JSON-serializable dictionary."""
    if doc is None:
        return None
    
    # Convert ObjectId to string
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    
    # Convert datetime objects to ISO format strings
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            doc[key] = str(value)
    
    return doc

def clean_markdown(text):
    # Remove leading bullet points like *, -, or numbered lists
    text = re.sub(r'^\s*[-*+]\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s*', '', text, flags=re.MULTILINE)

    # Remove bold (**text**) and italic (*text* or _text_) formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'_(.*?)_', r'\1', text)

    # Remove extra whitespace
    text = re.sub(r'\n{2,}', '\n', text).strip()

    return text

@router.post("/pdf")
async def upload_pdf(request: Request, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Upload a PDF file, process it with OCR, and store in vector database.
    
    Args:
        file: PDF file to upload
        request: FastAPI request for session management
        
    Returns:
        JSON response with success message and status
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Create collection name based on filename with UUID
        base_filename = os.path.splitext(file.filename)[0]  # Remove .pdf extension
        # Generate a short UUID (6-7 characters)
        short_uuid = str(uuid.uuid4())[:7]
        collection_name = f"{base_filename}-{short_uuid}"
        
        # Check if collection already exists in Qdrant
        qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        
        # Get list of existing collections
        collections = qdrant_client.get_collections()
        collection_exists = any(col.name == collection_name for col in collections.collections)
        
        if collection_exists:
            # Collection already exists, skip processing
            print(f"[INFO] PDF '{file.filename}' already exists in collection: {collection_name}")
            
            # Store collection name in session for chat - make it user-specific
            user_collection_key = f"current_collection_{current_user['email']}"
            request.session[user_collection_key] = collection_name
            
            return JSONResponse(
                status_code=200,
                content={
                    "message": f"PDF '{file.filename}' already exists in the system!",
                    "status": "exists",
                    "collection_name": collection_name
                }
            )
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Process PDF using the RAG pipeline
        ocr_instruction = "Extract all Urdu text content accurately from the scanned pages."
        
        # Convert PDF to images
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"[INFO] Processing PDF: {file.filename}")
            image_files = convert_pdf_to_images(temp_file_path, temp_dir)
            
            # Extract text using OCR
            extracted_text = ocr_with_gemini(image_files, ocr_instruction)
            
            # Load model for processing
            model = load_model()
            
            # Generate summary and keywords
            summary, keywords = summarize_and_extract_keywords(extracted_text, model)
            
            # Create text chunks
            text_chunks = chunk_extracted_text(extracted_text)
            
            # Add metadata to chunks
            for i, doc in enumerate(text_chunks):
                doc.metadata = {
                    "source_pdf": file.filename,
                    "summary": summary,
                    "keywords": keywords,
                    "chunk_index": i
                }
            
            # Add dedicated summary chunk
            summary_doc = Document(
                page_content=summary,
                metadata={
                    "source_pdf": file.filename,
                    "type": "summary",
                    "keywords": keywords,
                    "summary": summary,
                    "chunk_index": -1
                }
            )
            text_chunks.append(summary_doc)
            
            # Prepare for vector DB
            valid_documents = [doc for doc in text_chunks if doc.page_content]
            texts = [doc.page_content for doc in valid_documents]
            metadatas = [doc.metadata for doc in valid_documents]
            
            # Create vector database
            create_vector_db(collection_name, texts, metadatas)
            
            # Store collection name in session for chat - make it user-specific
            user_collection_key = f"current_collection_{current_user['email']}"
            request.session[user_collection_key] = collection_name
            
            # Print processing details
            print(f"[INFO] Collection created: {collection_name}")
            print(f"[INFO] Chunks created: {len(valid_documents)}")
            print(f"[INFO] Summary: {summary[:200]}{'...' if len(summary) > 200 else ''}")
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "PDF processed and stored successfully!",
                "status": "new",
                "collection_name": collection_name
            }
        )
        
    except Exception as e:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, request: Request, current_user: dict = Depends(get_current_user)):
    """
    Chat with the RAG system using LangGraph with session management.
    Uses LangGraph's built-in MongoDB persistence for conversation history.
    
    Args:
        payload: ChatRequest containing query and optional session_id
        request: FastAPI request
        
    Returns:
        ChatResponse with answer, response_id, and session_id
    """
    try:
        response_id = uuid.uuid4()
        timestamp = datetime.utcnow()
        # Get collection name from session
        collection_name = None
        if payload.session_id:
            from backend.database import sessions_collection
            session = await sessions_collection.find_one({
                "session_id": payload.session_id,
                "user_email": current_user["email"],
                "visible": True
            })
            if session:
                collection_name = session.get("collection_name")
        if not collection_name:
            user_collection_key = f"current_collection_{current_user['email']}"
            collection_name = request.session.get(user_collection_key)
        if not collection_name:
            raise HTTPException(
                status_code=400, 
                detail="No PDF has been uploaded. Please upload a PDF first."
            )
        session_id = payload.session_id
        if not session_id:
            # Create new session
            session_id = str(uuid.uuid4())
            parts = collection_name.rsplit('-', 1)
            base_filename = parts[0] if len(parts) > 1 else collection_name
            title = f"{base_filename} chat"
            session_doc = {
                "session_id": session_id,
                "user_email": current_user["email"],
                "title": title,
                "visible": True,
                "created_at": timestamp,
                "updated_at": timestamp,
                "collection_name": collection_name,
                "first_message": payload.query
            }
            from backend.database import sessions_collection
            await sessions_collection.insert_one(session_doc)
        else:
            # Update session timestamp
            from backend.database import sessions_collection
            await sessions_collection.update_one(
                {"session_id": session_id, "user_email": current_user["email"]},
                {"$set": {"updated_at": timestamp}}
            )
        # Use LangGraph workflow for conversation
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise HTTPException(status_code=500, detail="MongoDB URI not configured")
        async with AsyncMongoDBSaver.from_conn_string(
            mongo_uri,
            db_name="UrduWhiz",
        ) as checkpointer:
            workflow = create_workflow(collection_name)
            app = workflow.compile(checkpointer=checkpointer)
            thread_id = session_id
            config = {"configurable": {"thread_id": thread_id}}
            try:
                existing_state = await checkpointer.aget(config)
                if existing_state and "channel_values" in existing_state and "messages" in existing_state["channel_values"]:
                    from langchain_core.messages import HumanMessage
                    existing_state["channel_values"]["messages"].append(HumanMessage(content=payload.query))
                    state = existing_state
                else:
                    from langchain_core.messages import HumanMessage
                    state = {"messages": [HumanMessage(content=payload.query)]}
            except Exception as e:
                from langchain_core.messages import HumanMessage
                state = {"messages": [HumanMessage(content=payload.query)]}
            if "channel_values" in state and "messages" in state["channel_values"]:
                workflow_state = {"messages": state["channel_values"]["messages"]}
            else:
                workflow_state = state
            result_state = await app.ainvoke(workflow_state, config)
            if "channel_values" in result_state and "messages" in result_state["channel_values"]:
                ai_message = result_state["channel_values"]["messages"][-1]
            else:
                ai_message = result_state["messages"][-1]
            answer = ai_message.content
            # Clean markdown from answer
            answer = clean_markdown(answer)
            return ChatResponse(
                answer=answer,
                response_id=response_id,
                session_id=session_id
            )
        
    except Exception as e:
        print(f"[ERROR] Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    """
    Get all sessions for the current user.
    """
    try:
        print(f"[DEBUG] Getting sessions for user: {current_user['email']}")
        from backend.database import sessions_collection
        sessions_cursor = sessions_collection.find(
            {"user_email": current_user["email"], "visible": True}
        ).sort("updated_at", -1).limit(100)
        
        sessions = []
        async for session in sessions_cursor:
            converted_session = convert_mongo_doc(session)
            sessions.append(converted_session)
            print(f"[DEBUG] Found session: {converted_session}")
        
        print(f"[DEBUG] Total sessions found: {len(sessions)}")
        return sessions
    except Exception as e:
        print(f"[ERROR] Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching sessions: {str(e)}")

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get all messages for a specific session using LangGraph's persistence.
    """
    try:
        print(f"[DEBUG] Getting messages for session_id: {session_id}")
        print(f"[DEBUG] For user_email: {current_user['email']}")
        
        # Verify session belongs to user
        from backend.database import sessions_collection
        session = await sessions_collection.find_one({
            "session_id": session_id,
            "user_email": current_user["email"],
            "visible": True
        })
        
        if not session:
            print(f"[DEBUG] Session {session_id} not found for user {current_user['email']}")
            return []
        
        # Get messages from LangGraph's persistence
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise HTTPException(status_code=500, detail="MongoDB URI not configured")
        
        async with AsyncMongoDBSaver.from_conn_string(
            mongo_uri,
            db_name="UrduWhiz",
        ) as checkpointer:
            # Get the thread state from LangGraph
            thread_id = session_id
            config = {"configurable": {"thread_id": thread_id}}
            
            try:
                # Try to get existing state using async method
                print(f"[DEBUG] Attempting to get state for thread_id: {thread_id}")
                
                # First, let's try to list all checkpoints to see what's available
                try:
                    checkpoints = []
                    async for checkpoint in checkpointer.alist(config):
                        checkpoints.append(checkpoint)
                    print(f"[DEBUG] Available checkpoints: {checkpoints}")
                except Exception as list_error:
                    print(f"[DEBUG] Could not list checkpoints: {list_error}")
                
                state = await checkpointer.aget(config)
                print(f"[DEBUG] Retrieved state: {state}")
                
                if state and "channel_values" in state and "messages" in state["channel_values"]:
                    messages = state["channel_values"]["messages"]
                    print(f"[DEBUG] Retrieved {len(messages)} messages from LangGraph for session {session_id}")
                    print(f"[DEBUG] Messages: {[f'{msg.type}: {msg.content[:50]}...' for msg in messages]}")
                    
                    # Convert LangGraph messages to frontend format
                    formatted_messages = []
                    for msg in messages:
                        formatted_messages.append({
                            "role": "user" if msg.type == "human" else "assistant",
                            "content": msg.content,
                            "timestamp": datetime.utcnow().isoformat()  # LangGraph doesn't store timestamps
                        })
                    
                    return formatted_messages
                else:
                    print(f"[DEBUG] No messages found in LangGraph for session {session_id}")
                    print(f"[DEBUG] State structure: {state}")
                    return []
                    
            except Exception as e:
                print(f"[DEBUG] Error getting messages from LangGraph: {str(e)}")
                print(f"[DEBUG] Full error details: {e}")
                return []
        
    except Exception as e:
        print(f"[ERROR] Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {str(e)}")

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    print(f"Trying to delete session: {session_id} for user: {current_user['email']}")
    from backend.database import sessions_collection
    result = await sessions_collection.update_one(
        {"session_id": session_id, "user_email": current_user["email"]},
        {"$set": {"visible": False}}
    )
    print(f"Modified count: {result.modified_count}")
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

@router.get("/sessions/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    from backend.database import sessions_collection
    session = await sessions_collection.find_one({
        "session_id": session_id,
        "user_email": current_user["email"],
        "visible": True
    })
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return convert_mongo_doc(session)

 