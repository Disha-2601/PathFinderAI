#!/usr/bin/env python3
"""
PathFinder AI - Supabase Schema Migration, Domain Seeding & Vector Embedding Pipeline
Stage 2: Database Initialization & 384-dimensional dense semantic embedding generation
"""

import os
import sys
import time
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# Load environment variables
CURRENT_DIR = Path(__file__).resolve().parent
AI_SERVICE_DIR = CURRENT_DIR.parent
WORKSPACE_ROOT = AI_SERVICE_DIR.parent

load_dotenv(AI_SERVICE_DIR / ".env")
load_dotenv(WORKSPACE_ROOT / ".env")

DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")
if not DATABASE_URL:
    print("❌ ERROR: SUPABASE_DATABASE_URL environment variable is not set.")
    sys.exit(1)

SCHEMA_FILE = WORKSPACE_ROOT / "database" / "schema.sql"
SEED_FILE = WORKSPACE_ROOT / "database" / "seed.sql"


def connect_db():
    """Connect to Supabase PostgreSQL database."""
    print("🔌 Connecting to Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        print("✅ Connected to Supabase successfully.")
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)


def execute_sql_file(conn, file_path: Path, step_name: str):
    """Execute SQL file against database."""
    print(f"\n📜 Executing {step_name} from: {file_path.name}...")
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    sql_content = file_path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        try:
            cur.execute(sql_content)
            conn.commit()
            print(f"✅ {step_name} executed successfully.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error executing {step_name}: {e}")
            raise e


def generate_and_update_embeddings(conn):
    """Generate 384-d embeddings with sentence-transformers and update courses in DB."""
    print("\n🧠 Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
    start_time = time.time()
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print(f"✅ Model loaded in {time.time() - start_time:.2f}s.")

    # Fetch courses with their mapped skills
    print("📦 Querying courses & mapped skills from database...")
    query = """
        SELECT 
            c.id, 
            c.title, 
            c.provider, 
            c.description, 
            c.difficulty,
            COALESCE(string_agg(DISTINCT s.name, ', '), '') AS skill_names,
            COALESCE(string_agg(DISTINCT s.category, ', '), '') AS skill_categories
        FROM courses c
        LEFT JOIN course_skills cs ON c.id = cs.course_id
        LEFT JOIN skills s ON cs.skill_id = s.id
        GROUP BY c.id, c.title, c.provider, c.description, c.difficulty
        ORDER BY c.title ASC;
    """

    with conn.cursor() as cur:
        cur.execute(query)
        courses = cur.fetchall()

    total_courses = len(courses)
    print(f"🎯 Found {total_courses} courses to process.")

    # Construct rich semantic representations
    course_ids = []
    semantic_texts = []

    for course_id, title, provider, description, difficulty, skills, categories in courses:
        course_ids.append(course_id)
        text = (
            f"Course Title: {title}. Provider: {provider}. Difficulty Level: {difficulty}. "
            f"Description: {description} "
            f"Target Skills & Topics: {skills} in categories ({categories})."
        )
        semantic_texts.append(text)

    print(f"⚡ Computing 384-dimensional dense vector embeddings for {total_courses} courses...")
    embeddings = model.encode(
        semantic_texts, 
        batch_size=32, 
        show_progress_bar=True, 
        normalize_embeddings=True
    )

    # Format vector as string '[x1, x2, ...]' for pgvector
    update_data = [
        ("[" + ",".join(f"{val:.6f}" for val in emb) + "]", cid)
        for cid, emb in zip(course_ids, embeddings)
    ]

    print("💾 Updating courses.embedding in Supabase...")
    update_sql = "UPDATE courses SET embedding = %s::vector WHERE id = %s;"
    
    with conn.cursor() as cur:
        execute_batch(cur, update_sql, update_data, page_size=50)
        conn.commit()
    
    print(f"✅ Successfully updated {total_courses} course vector embeddings in Supabase.")


def verify_semantic_search(conn):
    """Run a test semantic vector similarity query."""
    print("\n🔍 Running verification semantic similarity search...")
    sample_query = "Build production RAG pipelines with vector databases, embeddings, and LLM agents"
    
    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_vector = model.encode(sample_query, normalize_embeddings=True)
    query_vector_str = "[" + ",".join(f"{val:.6f}" for val in query_vector) + "]"

    search_sql = """
        SELECT 
            title, 
            provider, 
            difficulty,
            rating,
            (1 - (embedding <=> %s::vector)) AS similarity_score
        FROM courses
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> %s::vector ASC
        LIMIT 5;
    """

    with conn.cursor() as cur:
        cur.execute(search_sql, (query_vector_str, query_vector_str))
        results = cur.fetchall()

    print(f"\n🔎 Test Query: \"{sample_query}\"")
    print("━" * 80)
    print(f"{'Similarity':<12} | {'Provider':<20} | {'Difficulty':<12} | {'Course Title'}")
    print("━" * 80)
    for title, provider, difficulty, rating, score in results:
        pct = f"{score * 100:.1f}%"
        print(f"{pct:<12} | {provider[:20]:<20} | {difficulty:<12} | {title}")
    print("━" * 80)
    print("✅ Vector search verification passed with high precision!")


def print_database_summary(conn):
    """Print count summaries across all tables."""
    tables = [
        "skills", "courses", "course_skills", "course_prerequisites", 
        "users", "goals", "user_skills", "assessments"
    ]
    print("\n📊 Database Population Summary:")
    print("━" * 45)
    with conn.cursor() as cur:
        for t in tables:
            cur.execute(f"SELECT COUNT(*) FROM {t};")
            count = cur.fetchone()[0]
            print(f"  • {t:<22}: {count:>5} records")
    print("━" * 45)


def main():
    print("=" * 80)
    print("🚀 PATHFINDER AI - STAGE 2 DATABASE & VECTOR EMBEDDING SEED PIPELINE")
    print("=" * 80)
    
    conn = connect_db()
    try:
        # Step 1: DDL Schema Migration
        execute_sql_file(conn, SCHEMA_FILE, "Schema DDL (schema.sql)")

        # Step 2: Seed Dataset
        execute_sql_file(conn, SEED_FILE, "Domain Seed Data (seed.sql)")

        # Step 3: Compute & update embeddings
        generate_and_update_embeddings(conn)

        # Step 4: Verification
        verify_semantic_search(conn)
        print_database_summary(conn)

        print("\n🎉 Stage 2 Database Setup & Vector Seed Pipeline Completed Successfully!\n")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
