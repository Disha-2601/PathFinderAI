"""
Database connection utilities for PathFinder AI Service
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")


def get_db_connection():
    """Create and return a new database connection with RealDictCursor."""
    if not DATABASE_URL:
        raise RuntimeError("SUPABASE_DATABASE_URL environment variable is not configured.")
    
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn
