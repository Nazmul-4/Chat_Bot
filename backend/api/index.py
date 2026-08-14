import sys
from pathlib import Path

# Add backend root folder to Python path so Python can find main.py and db_engine.py
sys.path.append(str(Path(__file__).resolve().parent.parent))

# Import the actual FastAPI app from main.py
from main import app