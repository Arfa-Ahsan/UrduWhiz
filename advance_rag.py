# --- IMPORTS ---
import os
import io
import uuid
import json
import time
import torch
import tempfile
import asyncio
from typing import List, Dict, TypedDict
from datetime import datetime
from PIL import Image
import fitz  # PyMuPDF
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from google.generativeai import configure, GenerativeModel
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.vectorstores import Qdrant
from pdf2image import convert_from_path
from langgraph.checkpoint.mongodb.aio import AsyncMongoDBSaver
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langchain_core.runnables import Runnable
from sentence_transformers import SentenceTransformer, util
from langchain.retrievers.multi_query import MultiQueryRetriever

# --- ENVIRONMENT SETUP ---
load_dotenv()
hf_home = os.getenv("HF_HOME")
if hf_home:
    os.environ["HF_HOME"] = hf_home

# Set Google credentials path
google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if google_creds:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_creds

# --- FUNCTION AND CLASS DEFINITIONS ---
def load_model():
    """Load and return the Gemini 2.0 Flash model using LangChain wrapper."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY not found in environment variables.")
    model = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=api_key,
    )
    return model

def convert_pdf_to_images(pdf_path, output_folder, dpi=300):
    """Convert scanned PDF to high-res images."""
    images = convert_from_path(pdf_path, dpi=dpi)
    image_paths = []
    for i, image in enumerate(images):
        image_path = os.path.join(output_folder, f'page_{i+1}.jpg')
        image.save(image_path, 'JPEG')
        image_paths.append(image_path)
    return image_paths

def ocr_with_gemini(image_paths, instruction):
    """Perform OCR on images using Gemini model."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY not found in environment variables.")
    configure(api_key=api_key)
    model = GenerativeModel("gemini-2.0-flash")
    images = [Image.open(path) for path in image_paths]
    prompt = f"""
    {instruction}
    These are pages from a scanned Urdu storybook. Extract all the Urdu text accurately.
    The pages only contain flowing Urdu text without tables, images, or complex layouts.
    Preserve paragraph breaks and maintain the natural structure of the story.
    Do not add any extra formatting or interpretation.
    """
    try:
        response = model.generate_content([prompt, *images])
    finally:
        for img in images:
            img.close()
    return response.text

def summarize_and_extract_keywords(text, model):
    """Summarize Urdu story and extract keywords as a list."""
    print("[INFO] Generating summary...")
    summary_prompt = f"""
    مندرجہ ذیل اردو کہانی کا خلاصہ اردو میں چند سادہ جملوں میں بیان کریں:\n\n{text}
    """
    summary_response = model.invoke(summary_prompt)
    summary = summary_response.content.strip()
    print(f"[DEBUG] Summary generated (first 1000 chars): {summary[:1000]}")
    print("[INFO] Extracting keywords...")
    keyword_prompt = f"""
    نیچے دی گئی کہانی سے ۵ سے ۱۰ اہم اردو کلیدی الفاظ (keywords) صرف ایک لائن میں، صرف الفاظ، کوما سے جدا کر کے لکھیں۔ وضاحت نہ دیں:\n\n{text}
    """
    keyword_response = model.invoke(keyword_prompt)
    keywords = [kw.strip() for kw in keyword_response.content.strip().split(',') if kw.strip()]
    print(f"[DEBUG] Keywords extracted: {keywords}")
    return summary, keywords

def chunk_extracted_text(text, chunk_size=1000, chunk_overlap=200):
    """Split large Urdu text into overlapping chunks for LLM ingestion."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.create_documents([text])

def create_vector_db(collection_name: str, texts: List[str], metadatas: List[Dict]) -> None:
    """Create a Qdrant vector DB collection and upload documents with payload indexes for filtering."""
    print("[INFO] Generating embeddings...")
    vectors = embeddings.embed_documents(texts)
    print("[INFO] Connecting to Qdrant...")
    client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY")
    )
    print("[INFO] Creating collection if it doesn't exist...")
    if collection_name not in [c.name for c in client.get_collections().collections]:
        client.recreate_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=512, distance=Distance.COSINE)
        )
        print(f"[INFO] Collection '{collection_name}' created.")
    else:
        print(f"[INFO] Collection '{collection_name}' already exists.")
    # --- PAYLOAD INDEX CREATION (required for filtering on keywords/summary/type) ---
    try:
        client.create_payload_index(
            collection_name=collection_name,
            field_name="keywords",
            field_schema="keyword"
        )
        print("[INFO] Payload index for 'keywords' created (type: keyword).")
    except Exception as e:
        print(f"[WARN] Could not create 'keywords' index (may already exist): {e}")
    try:
        client.create_payload_index(
            collection_name=collection_name,
            field_name="summary",
            field_schema="keyword"
        )
        print("[INFO] Payload index for 'summary' created (type: keyword).")
    except Exception as e:
        print(f"[WARN] Could not create 'summary' index (may already exist): {e}")
    try:
        client.create_payload_index(
            collection_name=collection_name,
            field_name="type",
            field_schema="keyword"
        )
        print("[INFO] Payload index for 'type' created (type: keyword).")
    except Exception as e:
        print(f"[WARN] Could not create 'type' index (may already exist): {e}")
    # --- END PAYLOAD INDEX CREATION ---
    print("[INFO] Uploading vectors to Qdrant...")
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vectors[i],
            payload={**metadatas[i], "page_content": texts[i]}
        )
        for i in range(len(texts))
    ]
    client.upsert(collection_name=collection_name, points=points)
    print(f"[INFO] Successfully uploaded {len(points)} documents to Qdrant.")

def get_retriever(collection_name: str, k: int = 5):
    """Return a semantic retriever backed by Qdrant and HuggingFace embeddings."""
    qdrant_client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY")
    )
    vectorstore = Qdrant(
        client=qdrant_client,
        collection_name=collection_name,
        embeddings=embeddings,
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    return retriever

def hybrid_retrieve(query, collection_name, k=5):
    """Retrieve documents using both vector similarity and keyword/summary match."""
    print(f"[DEBUG] hybrid_retrieve called with collection: {collection_name}")
    print(f"[DEBUG] Query: {query}")
    
    qdrant_client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY")
    )
    
    # Check if collection exists
    try:
        collections = qdrant_client.get_collections()
        collection_names = [c.name for c in collections.collections]
        print(f"[DEBUG] Available collections: {collection_names}")
        
        if collection_name not in collection_names:
            print(f"[ERROR] Collection '{collection_name}' not found!")
            return []
            
    except Exception as e:
        print(f"[ERROR] Error checking collections: {e}")
        return []
    
    vectorstore = Qdrant(
        client=qdrant_client,
        collection_name=collection_name,
        embeddings=embeddings,
    )
    vector_docs = vectorstore.similarity_search(query, k=k)
    print(f"[DEBUG] Vector search returned {len(vector_docs)} documents")
    
    summary_keywords = ["خلاصہ", "مرکزی خیال", "theme", "summary", "main idea", "موضوع"]
    include_summary = any(word in query for word in summary_keywords)
    summary_doc = None
    if include_summary:
        filter_summary = {"must": [{"key": "type", "match": {"value": "summary"}}]}
        try:
            docs = vectorstore.client.scroll(
                collection_name=collection_name,
                scroll_filter=filter_summary,
                limit=1
            )[0]
            from langchain_core.documents import Document
            if docs:
                summary_doc = Document(page_content=docs[0].payload.get("page_content", ""), metadata=docs[0].payload)
        except Exception as e:
            print(f"[WARN] Could not fetch summary chunk: {e}")
    filter_ = {
        "should": [
            {"key": "keywords", "match": {"value": query}},
            {"key": "summary", "match": {"value": query}},
        ]
    }
    try:
        payload_docs = vectorstore.client.scroll(
            collection_name=collection_name,
            scroll_filter=filter_,
            limit=k
        )[0]
        from langchain_core.documents import Document
        payload_docs = [Document(page_content=doc.payload.get("page_content", ""), metadata=doc.payload) for doc in payload_docs]
    except Exception as e:
        print(f"[WARN] Payload filter search failed: {e}")
        payload_docs = []
    seen = set()
    results = []
    if summary_doc:
        key = summary_doc.page_content[:100]
        if key not in seen:
            results.append(summary_doc)
            seen.add(key)
    for doc in payload_docs + vector_docs:
        key = doc.page_content[:100]
        if key not in seen:
            results.append(doc)
            seen.add(key)
    return results[:k]

class MessagesState(TypedDict):
    """State for LangGraph workflow, holds chat messages."""
    messages: list[BaseMessage]

def create_rag_node(collection_name: str):
    """Create a RAG node function that uses the specified collection name."""
    async def rag_node(state: MessagesState) -> dict:
        """LangGraph node for RAG: reranks, summarizes, and generates answer."""
        # Find the last user message (not AI message)
        user_message = None
        user_message_index = -1
        
        for i, msg in enumerate(state["messages"]):
            if msg.type == "human":
                user_message = msg.content
                user_message_index = i
        
        if not user_message:
            print(f"[ERROR] No user message found in state")
            return {"messages": state["messages"] + [AIMessage(content="عذر خواہ ہوں، کوئی سوال نہیں ملا۔")]}
        
        # Only process if this is the most recent user message
        if user_message_index != len(state["messages"]) - 1:
            print(f"[DEBUG] User message is not the most recent, skipping processing")
            return {"messages": state["messages"]}
        
        summarized_history = state.get("conversation_summary", "")
        last_7_messages = state["messages"][-7:]
        last_7_text = "\n".join([f"{msg.type.capitalize()}: {msg.content}" for msg in last_7_messages])
        
        print(f"[DEBUG] RAG node using collection: {collection_name}")
        print(f"[DEBUG] User message: {user_message}")
        print(f"[DEBUG] Total messages in state: {len(state['messages'])}")
        print(f"[DEBUG] Message types: {[msg.type for msg in state['messages']]}")
        print(f"[DEBUG] User message index: {user_message_index}")
        
        # Get documents from the correct collection
        docs = hybrid_retrieve(user_message, collection_name, k=5)
        print(f"[DEBUG] Retrieved {len(docs)} documents from collection {collection_name}")
        
        if not docs:
            print(f"[WARNING] No documents found in collection {collection_name}")
            # Return a message indicating no context found
            return {"messages": state["messages"] + [AIMessage(content="عذر خواہ ہوں، اس PDF سے متعلق معلومات دستیاب نہیں ہیں۔ براہ کرم یقینی بنائیں کہ PDF اپلوڈ کی گئی ہے۔")]}
        
        doc_texts = [doc.page_content for doc in docs]
        query_emb = reranker_model.encode(user_message, convert_to_tensor=True)
        doc_embs = reranker_model.encode(doc_texts, convert_to_tensor=True)
        cos_scores = util.cos_sim(query_emb, doc_embs)[0]
        top_k = torch.topk(cos_scores, k=min(3, len(docs)))
        reranked_docs = [docs[i] for i in top_k.indices]
        context_text = "\n\n".join([doc.page_content for doc in reranked_docs])
        
        print(f"[DEBUG] Context length: {len(context_text)} characters")
        print(f"[DEBUG] Context preview: {context_text[:200]}...")
        
        rag_input = {
            "context": context_text,
            "question": user_message,
            "history_summary": summarized_history,
            "recent_history": last_7_text
        }
        full_prompt = qa_template.invoke(rag_input)
        result = await model.ainvoke(full_prompt)
        print("📘 جواب:", result.content)
        return {"messages": state["messages"] + [AIMessage(content=result.content)]}
    return rag_node

def create_workflow(collection_name: str):
    """Create a LangGraph workflow for the specified collection."""
    workflow = StateGraph(MessagesState)
    rag_node_func = create_rag_node(collection_name)
    workflow.add_node("rag", rag_node_func)
    workflow.set_entry_point("rag")
    workflow.add_edge("rag", END)
    return workflow

# --- INITIALIZATION OF EMBEDDINGS, MODELS, PROMPT, ETC. ---
qa_template = PromptTemplate(
    input_variables=["context", "question", "history_summary", "recent_history"],
    template="""
آپ ایک ماہر اردو زبان کے تجزیہ کار ہیں جو بچوں کی کہانیوں کے ساتھ کام کرتے ہیں۔ آپ کا کام ہے کہ دی گئی متن/کہانی کو مکمل طور پر سمجھ کر، اس کی روشنی میں سوالات کے جامع، واضح اور درست جوابات فراہم کریں۔

**جواب کی طوالت:**
- تفصیلی یا فہمیدہ سوالات کے لیے: 3-4 سطروں میں مکمل جواب
- مخصوص سوالات (نام، مقام، تاریخ وغیرہ) کے لیے: 1-3 سطروں میں مختصر جواب
- پیچیدہ سوالات کے لیے: ضرورت کے مطابق تفصیلی جواب

**کوالٹی کے معیار:**
- جوابات واضح، مربوط اور فہم میں آسان ہوں
- اگر کوئی معلومات دستیاب نہیں ہیں تو یہ واضح کریں: "اس کی تفصیل دستیاب نہیں ہے"
- ضرورت کے مطابق مثالیں یا وضاحت شامل کریں
- جوابات مکمل اردو زبان میں دیے جائیں

**بنیادی اصول:**
- سوالات کا جواب بنیادی طور پر فراہم کردہ متن/کہانی کی معلومات پر مبنی ہو
- اگر سوال متن سے متعلق ہے تو اس کا جواب متن کی بنیاد پر دیں
- اگر سوال عمومی معلومات کے بارے میں ہے تو اپنے علم کا استعمال کریں

**الفاظ کا مطلب:**
- اگر کوئی کسی خاص لفظ کا مطلب پوچھے تو:
  - پہلے اس کا آسان مطلب بتائیں
  - پھر اسے ایک آسان جملے میں استعمال کریں
  - مثال: "خوشی کا مطلب ہے خوش ہونا۔ جملہ: بچہ کھیل کر بہت خوشی محسوس کرتا ہے۔"

**زبان کی پابندی:**
- اگر صارف انگریزی، رومن اردو یا کوئی اور زبان استعمال کرے تو جواب دیں: "میں صرف اردو زبان میں سوالات کا جواب دے سکتا ہوں۔ براہ کرم اردو میں لکھیں۔"
- تمام جوابات صرف اردو زبان میں دیں

**PDF کی جانچ:**
- اگر اپ لوڈ شدہ PDF کہانی کے بارے میں نہیں ہے تو جواب دیں: "معذرت، یہ PDF کہانی کے بارے میں نہیں ہے، لہذا میں اس سے متعلق سوالات کا جواب نہیں دے سکتا۔"

**پچھلی گفتگو کا خلاصہ:**
{history_summary}

**حالیہ پیغامات:**
{recent_history}

**سیاق و سباق (کہانی):**
{context}

**سوال:**
{question}

**جواب:**
"""
)

model=load_model()
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/distiluse-base-multilingual-cased-v2")
collection_name="unnamed"
prompt = qa_template
reranker_model = SentenceTransformer("distiluse-base-multilingual-cased-v2")


# --- GRAPH/MEMORY/WORKFLOW SETUP ---
# Default workflow for main function - will be created when needed
workflow = None


# --- MAIN EXECUTION ---
async def main():
    """Main function to process PDF, build vector DB, and run interactive chat."""
    pdf_file = r"D:\urdu tutor\data\3 shehzadiyan.pdf"
    ocr_instruction = "Extract all Urdu text content accurately from the scanned pages."
    text_chunks = []
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"[INFO] Using temp directory: {temp_dir}")
        image_files = convert_pdf_to_images(pdf_file, temp_dir)
        extracted_text = ocr_with_gemini(image_files, ocr_instruction)
        summary, keywords = summarize_and_extract_keywords(extracted_text, model)
        text_chunks = chunk_extracted_text(extracted_text)
        for i, doc in enumerate(text_chunks):
            doc.metadata = {
                "source_pdf": os.path.basename(pdf_file),
                "summary": summary,
                "keywords": keywords,
                "chunk_index": i
            }
        from langchain_core.documents import Document
        summary_doc = Document(
            page_content=summary,
            metadata={
                "source_pdf": os.path.basename(pdf_file),
                "type": "summary",
                "keywords": keywords,
                "summary": summary,
                "chunk_index": -1
            }
        )
        text_chunks.append(summary_doc)
        print(f"\n[INFO] Total Chunks: {len(text_chunks)}\n")
        for i, doc in enumerate(text_chunks):
            print(f"--- Chunk {i+1} ---")
            print("Text:\n", doc.page_content[:1000], "...\n")
            print("Metadata:", doc.metadata)
            print()
    if text_chunks:
        valid_documents = [doc for doc in text_chunks if doc.page_content]
        texts = [doc.page_content for doc in valid_documents]
        metadatas = [doc.metadata for doc in valid_documents]
    else:
        print("[ERROR] No text chunks were created. Check OCR output or chunking function.")
        return
    create_vector_db(collection_name, texts, metadatas)
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
       print("[ERROR] MONGO_URI not found in environment!")
    async with AsyncMongoDBSaver.from_conn_string(
        mongo_uri,
        db_name="UrduWhiz",
    ) as checkpointer:
        # Create workflow for the collection
        workflow = create_workflow(collection_name)
        app = workflow.compile(checkpointer=checkpointer)

        async def interactive_chat():
            thread_id = str(uuid.uuid4())
            state = {"messages": [], "conversation_summary": ""}
            config = {"configurable": {"thread_id": thread_id}}
            while True:
                query = input("📝 سوال کریں: ")
                if query.lower() in ["exit", "quit", "خروج", "بند کریں"]:
                    print("👋 پروگرام بند ہو گیا۔")
                    break
                if not query.strip():
                    continue 
                state["messages"].append(HumanMessage(content=query))
                if len(state["messages"]) > 7:
                    old_messages = state["messages"][:-10]
                    history_text = "\n".join([f"{msg.type.capitalize()}: {msg.content}" for msg in old_messages])
                    summary_prompt = f"Summarize the following conversation history:\n{history_text}\nPrevious summary (if any): {state.get('conversation_summary', '')}"
                    summary_response = await model.ainvoke(summary_prompt)
                    state["conversation_summary"] = summary_response.content.strip()
                    state["messages"] = state["messages"][-7:]
                state = await app.ainvoke(state, config)
        await interactive_chat()

if __name__ == "__main__":
    asyncio.run(main())











