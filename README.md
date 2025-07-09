# UrduWhiz

**UrduWhiz** is an AI-powered web application that enables users to upload scanned Urdu storybooks in PDF format and interact with them through natural language questions in Urdu. The app leverages advanced OCR, Retrieval-Augmented Generation (RAG), and modern web technologies to make Urdu literature accessible, searchable, and interactive.

---

## Problem Statement

Accessing and understanding Urdu storybooks in digital form is challenging, especially when the content is locked in scanned PDFs. Traditional search and reading methods are not effective for non-selectable, image-based Urdu text. There is a need for a tool that can:
- Extract Urdu text from scanned PDFs,
- Summarize and index the content,
- Allow users to ask questions in Urdu and receive intelligent, context-aware answers.

---

## Solution

UrduWhiz solves this by combining state-of-the-art OCR, semantic search, and generative AI:
- **PDF Upload & OCR:** Users upload scanned Urdu PDFs, which are converted to images and processed with Google Gemini for accurate Urdu OCR.
- **Summarization & Indexing:** The extracted text is summarized, keywords are generated, and the content is chunked and stored in a vector database (Qdrant) for efficient retrieval.
- **Chat-based Q&A:** Users can ask questions in Urdu about the uploaded story. The app retrieves relevant chunks using semantic and keyword search, then uses a generative model to answer in natural, fluent Urdu.
- **Session Management:** Users can manage multiple chat sessions, revisit previous conversations, and delete sessions as needed.

---
![image](https://github.com/user-attachments/assets/37704e0a-57aa-4bd5-b403-243b8466d8ae)


## Features

### Core Features
- **Upload Scanned Urdu PDFs:** Supports image-based storybooks.
- **AI-powered Urdu OCR:** Uses Google Gemini for high-accuracy Urdu text extraction.
- **Automatic Summarization & Keyword Extraction:** Summarizes stories and extracts key Urdu terms.
- **Retrieval-Augmented Generation (RAG):** Combines semantic search (Qdrant + HuggingFace) with generative AI for accurate answers.
- **Urdu Chat Interface:** Ask questions in Urdu and get context-aware, natural Urdu responses.
- **Session Management:** View, revisit, and delete chat sessions.
- **Modern, Responsive UI:** Built with React, Tailwind CSS, and Vite for a smooth user experience.

### Advanced Backend
- **FastAPI-based REST API** for PDF upload, chat, and session management.
- **MongoDB** for session and user data.
- **Qdrant Vector Database** for semantic search and retrieval.
- **LangChain** for LLM orchestration and prompt management.
- **Google Gemini & HuggingFace Embeddings** for OCR and semantic search.

### Security & Auth
- **JWT Authentication** for secure user sessions.
- **Password hashing, email verification, and password reset** features.
- **CORS and environment-based configuration** for safe deployment.

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React, Vite, Tailwind CSS, React Router DOM   |
| Backend    | FastAPI, Python, LangChain, Qdrant, MongoDB   |
| AI/ML      | Google Gemini (OCR & LLM), HuggingFace, SentenceTransformers |
| Database   | MongoDB (sessions), Qdrant (vector search)    |
| Auth       | JWT, OAuth2, Email Verification               |
| DevOps     | Docker-ready, .env configuration              |

---

## Project Structure

```
UrduWhiz/
  ├── backend/         # FastAPI app, RAG pipeline, OCR, API routes
  ├── frontend/        # React app, chat UI, PDF upload, session management
  ├── advance_rag.py   # Custom RAG pipeline, OCR, vector DB logic
  ├── requirements.txt # Python dependencies
  └── README.md        # This file
```

---

## Usage

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
# Set up .env with your API keys and DB info
python main.py
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Using UrduWhiz

1. Register and log in.
2. Upload a scanned Urdu storybook PDF.
3. Ask questions in Urdu about the story, or use suggested prompts.
4. View, revisit, or delete chat sessions as needed.

---

## API Endpoints (Backend)

- `POST /api/pdf` — Upload and process Urdu PDF
- `POST /api/chat` — Ask a question about the uploaded story
- `GET /api/sessions` — List user chat sessions
- `GET /api/sessions/{session_id}` — Get session details
- `GET /api/sessions/{session_id}/messages` — Get chat history
- `DELETE /api/sessions/{session_id}` — Delete a session
- Auth: `/api/register`, `/api/login`, `/api/profile`, `/api/logout`, `/api/refresh`, etc.

---

## Example Workflow

1. **Upload PDF:** The backend converts the PDF to images, performs OCR with Gemini, summarizes the story, and stores chunks in Qdrant.
2. **Ask a Question:** The frontend sends your Urdu question to the backend, which retrieves relevant chunks and generates an answer using Gemini.
3. **Chat Sessions:** All your chats are saved and can be revisited or deleted.

---

## Acknowledgements

- [Google Gemini](https://ai.google.dev/) for Urdu OCR and LLM
- [LangChain](https://www.langchain.com/) for orchestration
- [Qdrant](https://qdrant.tech/) for vector search
- [HuggingFace](https://huggingface.co/) for embeddings

---

## License

MIT License

---

**UrduWhiz** — Making Urdu literature searchable, interactive, and accessible with AI. 
