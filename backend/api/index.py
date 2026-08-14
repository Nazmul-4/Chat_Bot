import sys
from pathlib import Path

# Add backend root folder to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

# Import the main FastAPI application
from main import app