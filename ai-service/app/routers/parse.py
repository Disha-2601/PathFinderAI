"""
AI Goal Parsing Router: Extracts structured career goal parameters from natural language prompts using Gemini 2.5 Flash
"""

import os
import json
import uuid
import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from openai import OpenAI
from app.database import get_db_connection

router = APIRouter(prefix="/ai", tags=["Goal Parsing"])


class ParseGoalRequest(BaseModel):
    raw_prompt: str = Field(..., description="User's natural language career or learning objective")
    user_id: Optional[str] = Field(None, description="UUID of the user (optional, uses default if omitted)")


class ParsedGoalData(BaseModel):
    target_role: str
    timeframe_weeks: int = 12
    weekly_hours: int = 10
    experience_level: str = "intermediate"
    preferred_learning_style: str = "hands_on_projects"
    target_skills: List[str] = []
    notes: Optional[str] = None


class ParseGoalResponse(BaseModel):
    status: str = "success"
    goal_id: str
    user_id: str
    parsed_data: ParsedGoalData


def get_available_skills_from_db():
    """Fetch existing skills taxonomy from the database for accurate entity alignment."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT name FROM skills ORDER BY name ASC;")
            rows = cur.fetchall()
            return [r["name"] for r in rows]
    except Exception as e:
        print(f"⚠️ Warning: Could not fetch skills taxonomy: {e}")
        return []
    finally:
        conn.close()


def parse_prompt_with_gemini(raw_prompt: str, available_skills: List[str]) -> ParsedGoalData:
    """Use Gemini 2.5 Flash via OpenAI compatibility SDK to extract structured parameters."""
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENAI_API_KEY / Gemini API key is not configured in environment."
        )

    client = OpenAI(
        api_key=api_key,
        base_url=base_url
    )

    skills_reference = ", ".join(available_skills) if available_skills else "Python, FastAPI, Docker, Kubernetes, PostgreSQL, LLMs, RAG, AI Agents, React, TypeScript, Redis"

    system_prompt = f"""You are PathFinder AI's Senior Technical Career & Curriculum Architect.
Analyze the user's natural language career / learning statement and extract structured planning parameters.

Known database skills taxonomy:
[{skills_reference}]

You MUST output ONLY a valid, raw JSON object (with no markdown formatting or markdown ticks) matching this exact schema:
{{
  "target_role": "string (e.g. Senior AI Solutions Architect, Backend Engineer)",
  "timeframe_weeks": integer (extract weeks or convert months to weeks: default 12 if unspecified),
  "weekly_hours": integer (weekly hours allocated for study: default 10 if unspecified),
  "experience_level": "beginner" | "intermediate" | "advanced",
  "preferred_learning_style": "visual" | "hands_on_projects" | "reading_theory" | "mixed",
  "target_skills": ["Skill1", "Skill2"] (array of skill names closely matched with known taxonomy),
  "notes": "string (1-2 sentence executive summary of the user's objective)"
}}
"""

    # Candidate models in priority order
    candidate_models = [
        model_name,
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-flash"
    ]
    # Remove duplicates while preserving order
    candidate_models = list(dict.fromkeys(candidate_models))

    last_error = None
    for candidate in candidate_models:
        try:
            response = client.chat.completions.create(
                model=candidate,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": raw_prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            data = json.loads(content)

            return ParsedGoalData(
                target_role=data.get("target_role", "AI Software Engineer"),
                timeframe_weeks=int(data.get("timeframe_weeks", 12)),
                weekly_hours=int(data.get("weekly_hours", 10)),
                experience_level=data.get("experience_level", "intermediate"),
                preferred_learning_style=data.get("preferred_learning_style", "hands_on_projects"),
                target_skills=data.get("target_skills", []),
                notes=data.get("notes", raw_prompt[:200])
            )
        except Exception as e:
            last_error = e
            continue

    print(f"⚠️ Gemini LLM parser unavailable with configured models {candidate_models}; using deterministic parser fallback.")
    # Fallback heuristic parsing in case of network or rate limit issues
    return parse_prompt_fallback(raw_prompt)


def parse_prompt_fallback(raw_prompt: str) -> ParsedGoalData:
    prompt = raw_prompt.strip()
    lower_prompt = prompt.lower()
    months_match = re.search(r"(\d+)\s*(month|months|mo)\b", lower_prompt)
    weeks_match = re.search(r"(\d+)\s*(week|weeks|wk|wks)\b", lower_prompt)
    hours_match = re.search(r"(\d+)\s*(hour|hours|hr|hrs)\s*(?:/|per)?\s*(week|wk)?", lower_prompt)
    target_role_match = re.search(
        r"(?:become|as|into|to be|transition to)\s+(?:an?\s+)?([^,.]+?)(?:\s+in\s+\d+|\s+within\s+\d+|\s+with\s+|\s+focused\s+|\s+using\s+|$)",
        prompt,
        re.IGNORECASE
    )

    skill_matchers = [
        ("sql", "SQL"),
        ("postgres", "PostgreSQL & Relational DBs"),
        ("pandas", "Pandas"),
        ("powerbi", "PowerBI"),
        ("power bi", "PowerBI"),
        ("tableau", "Tableau"),
        ("business intelligence", "Business Intelligence"),
        ("statistics", "Statistics"),
        ("statistical", "Statistics"),
        ("analytics", "Data Analytics"),
        ("analyst", "Data Analytics"),
        ("data visualization", "Data Visualization"),
        ("dashboard", "Data Visualization"),
        ("python", "Python Programming"),
        ("fastapi", "FastAPI & Async Python"),
        ("llm", "Large Language Models (LLMs)"),
        ("rag", "Retrieval-Augmented Generation (RAG)"),
        ("vector", "Vector Databases & pgvector"),
        ("react", "React & Frontend Architecture"),
        ("typescript", "TypeScript & JavaScript"),
        ("javascript", "TypeScript & JavaScript"),
    ]
    target_skills = []
    for needle, skill in skill_matchers:
        if needle in lower_prompt and skill not in target_skills:
            target_skills.append(skill)

    if weeks_match:
        timeframe_weeks = int(weeks_match.group(1))
    elif months_match:
        timeframe_weeks = int(months_match.group(1)) * 4
    else:
        timeframe_weeks = 12

    explicit_data_goal = any(
        keyword in lower_prompt
        for keyword in ["data analyst", "analytics", "sql", "dashboard", "business intelligence", "power bi", "tableau", "statistics"]
    )

    return ParsedGoalData(
        target_role=target_role_match.group(1).strip() if target_role_match else ("Data Analyst" if explicit_data_goal else "AI & Backend Software Engineer"),
        timeframe_weeks=max(1, timeframe_weeks),
        weekly_hours=max(1, int(hours_match.group(1))) if hours_match else 10,
        experience_level="beginner" if "beginner" in lower_prompt else "advanced" if ("advanced" in lower_prompt or "senior" in lower_prompt) else "intermediate",
        preferred_learning_style="hands_on_projects",
        target_skills=target_skills or (["SQL", "Statistics", "Data Analytics"] if explicit_data_goal else ["Python Programming", "FastAPI & Async Python", "Large Language Models (LLMs)", "Retrieval-Augmented Generation (RAG)"]),
        notes=prompt
    )


@router.post("/parse-goal", response_model=ParseGoalResponse)
def parse_goal(request: ParseGoalRequest):
    """
    Parse a user's natural language career goal, align target skills with the database,
    and persist or update the goal in Supabase.
    """
    if not request.raw_prompt or not request.raw_prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="raw_prompt cannot be empty."
        )

    # 1. Fetch available skills to guide LLM entity recognition
    available_skills = get_available_skills_from_db()

    # 2. Parse with Gemini 2.5 Flash
    parsed = parse_prompt_with_gemini(request.raw_prompt, available_skills)

    # 3. Resolve user_id
    user_id = request.user_id
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # If user_id not provided or doesn't exist, retrieve or use the default demo user
            if not user_id:
                cur.execute("SELECT id FROM users LIMIT 1;")
                row = cur.fetchone()
                if row:
                    user_id = str(row["id"])
                else:
                    user_id = "a0000000-0000-0000-0000-000000000001"

            # Convert timeframe weeks to months for DB schema column
            target_timeline_months = max(1, round(parsed.timeframe_weeks / 4.33))

            # Check if user already has an active goal or create a new one
            cur.execute("""
                INSERT INTO goals (
                    user_id, 
                    target_role, 
                    target_timeline_months, 
                    weekly_study_hours, 
                    preferred_learning_style, 
                    status, 
                    notes
                ) VALUES (%s, %s, %s, %s, %s, 'active', %s)
                RETURNING id;
            """, (
                user_id,
                parsed.target_role,
                target_timeline_months,
                parsed.weekly_hours,
                parsed.preferred_learning_style,
                parsed.notes
            ))
            goal_row = cur.fetchone()
            goal_id = str(goal_row["id"])
            conn.commit()

        return ParseGoalResponse(
            status="success",
            goal_id=goal_id,
            user_id=user_id,
            parsed_data=parsed
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error saving parsed goal: {str(e)}"
        )
    finally:
        conn.close()
