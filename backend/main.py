import os
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from db_engine import search_database, CSV_FILE

app = FastAPI(title="Account Information AI Assistant")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Ollama LLM
llm_chat = ChatOllama(
    model="llama3.2",
    temperature=0,
    base_url="http://127.0.0.1:11434"
)

# Request schema
class ChatRequest(BaseModel):
    message: str

# Prompt template
system_prompt = """
You are a helpful customer service AI assistant.
The user searched for: "{query}"
We found {count} matching records in the database.

Provide a brief, polite 1-2 sentence response summarizing what was found in the user's language (English or Banglish).
Do NOT list individual account details, as they will be displayed automatically in clean UI cards below your message.
"""

prompt_template = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{query}")
])

rag_chain = prompt_template | llm_chat | StrOutputParser()


@app.get("/")
def root():
    return {"status": "online", "message": "FastAPI Account Assistant Backend is running."}


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    matched_records = search_database(user_query)
    record_count = len(matched_records)

    if record_count > 0:
        try:
            ai_message = rag_chain.invoke({
                "query": user_query,
                "count": record_count
            })
        except Exception as e:
            ai_message = f"Found {record_count} matching record(s) for your search."
    else:
        ai_message = f"No records found matching '{user_query}'. Please check the account name, ID, or phone number and try again."

    return {
        "query": user_query,
        "reply": ai_message,
        "count": record_count,
        "records": matched_records
    }


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Accepts a CSV file upload, validates expected columns, and updates the database."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    temp_path = f"temp_{file.filename}"

    try:
        # Save incoming file temporarily
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Validate that the uploaded CSV contains required columns
        df = pd.read_csv(temp_path)
        required_cols = {"Application Id", "Account Name", "Account No", "Mobile Number", "Application Date"}
        
        if not required_cols.issubset(set(df.columns)):
            os.remove(temp_path)
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns. CSV must contain: {', '.join(required_cols)}"
            )

        # Overwrite current database file
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