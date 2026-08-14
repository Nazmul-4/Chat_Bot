import os
import shutil
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from db_engine import search_database, CSV_FILE



# Load environment variables
load_dotenv()

app = FastAPI(title="Account Information AI Assistant")

# Enable CORS (Allows your frontend to make API calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Endpoint
# Root Endpoints (Handles all Vercel path rewrites)
@app.get("/")
@app.get("/api")
@app.get("/api/index")
@app.get("/api/index.py")
def root():
    return {
        "status": "online",
        "message": "ChatBot API is running successfully!"
    }

# Initialize Groq Cloud LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

llm_chat = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=GROQ_API_KEY
)

# Request schemas
class HistoryItem(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[HistoryItem]] = []

# Prompt 1: Contextual Query Standalone Converter
context_system_prompt = """
You are a database search query extractor.
Given the conversation history and a follow-up user query, combine key search terms into a concise list of search keywords.

Rules:
- Combine previous search entities (e.g., Name, ID, Acc No) with new constraints (e.g., Month, Date).
- Keep month names as 3-letter abbreviations if applicable (e.g., Apr, Mar, May).
- Return ONLY the search keywords separated by spaces (e.g., "MOHAMMAD Apr").
- Do NOT include full sentences, explanations, quotes, or punctuation.

Conversation History:
{history_text}
"""

context_prompt = ChatPromptTemplate.from_messages([
    ("system", context_system_prompt),
    ("human", "{query}")
])

query_refining_chain = context_prompt | llm_chat | StrOutputParser()

# Prompt 2: Response Summary Prompt
system_prompt = """
You are a helpful customer service AI assistant.
The user searched for: "{query}"
We found {count} matching records in the database.

Provide a brief, polite 1-2 sentence response summarizing what was found in the user's language (English or Banglish).
Do NOT list individual account details, as they will be displayed automatically in clean UI cards below your message.
"""

response_prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{query}")
])

rag_chain = response_prompt | llm_chat | StrOutputParser()


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    # 1. Refine query if conversation history exists
    effective_query = user_query
    if request.history and len(request.history) > 1:
        history_text = "\n".join([f"{h.sender}: {h.text}" for h in request.history[-6:]])
        try:
            refined_query = query_refining_chain.invoke({
                "history_text": history_text,
                "query": user_query
            }).strip().replace('"', '').replace("'", "")
            
            if refined_query:
                effective_query = refined_query
                print(f"[Multi-Turn Memory] Original: '{user_query}' -> Refined: '{effective_query}'")
        except Exception as e:
            print(f"Failed to refine query context: {e}")

    # 2. Search database
    matched_records = search_database(effective_query)
    record_count = len(matched_records)

    # Fallback to user_query if refined query yielded no results
    if record_count == 0 and effective_query != user_query:
        print(f"[Multi-Turn Memory] Refined query '{effective_query}' had 0 hits. Falling back to '{user_query}'")
        matched_records = search_database(user_query)
        record_count = len(matched_records)
        if record_count > 0:
            effective_query = user_query

    # 3. Generate conversational AI summary
    if record_count > 0:
        try:
            ai_message = rag_chain.invoke({
                "query": effective_query,
                "count": record_count
            })
        except Exception as e:
            ai_message = f"Found {record_count} matching record(s) for your search."
    else:
        ai_message = f"No records found matching '{effective_query}'. Please check the account name, ID, or phone number and try again."

    return {
        "query": effective_query,
        "reply": ai_message,
        "count": record_count,
        "records": matched_records
    }


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    temp_path = f"/tmp/temp_{file.filename}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        df = pd.read_csv(temp_path)
        required_cols = {"Application Id", "Account Name", "Account No", "Mobile Number", "Application Date"}
        
        if not required_cols.issubset(set(df.columns)):
            os.remove(temp_path)
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns. CSV must contain: {', '.join(required_cols)}"
            )

        # Note: Disk saves in Vercel serverless are non-persistent.
        shutil.move(temp_path, CSV_FILE)

        return {
            "status": "success",
            "message": f"Database updated successfully! Active file now contains {len(df)} records.",
            "filename": file.filename,
            "total_records": len(df)
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")