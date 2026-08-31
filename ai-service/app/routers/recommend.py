"""
Personalized Course Recommendation Router: Multi-Factor Ranking Engine
Score(c) = 0.25 * S_gap + 0.40 * S_sem + 0.10 * S_pre + 0.10 * S_diff + 0.05 * S_time + 0.10 * S_fb
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.database import get_db_connection
from app.services.embedding_service import encode_text

router = APIRouter(prefix="/ai", tags=["Recommendations"])


class RecommendRequest(BaseModel):
    goal_id: Optional[str] = Field(None, description="UUID of the learning goal")
    user_id: Optional[str] = Field(None, description="UUID of the user")
    target_role: Optional[str] = Field(None, description="Target role parsed from the user's goal")
    target_skills: List[str] = Field(default_factory=list, description="Target skills parsed from the user's goal")
    limit: Optional[int] = Field(10, description="Number of top recommendations to return (default 10)")


class ScoreBreakdown(BaseModel):
    skill_gap_score: float = Field(..., description="S_gap: Skill gap coverage (Weight: 25%)")
    semantic_similarity: float = Field(..., description="S_sem: Dense vector embedding cosine similarity (Weight: 40%)")
    prerequisite_fit: float = Field(..., description="S_pre: Prerequisite fulfillment ratio (Weight: 10%)")
    difficulty_match: float = Field(..., description="S_diff: Experience level compatibility (Weight: 10%)")
    time_fit: float = Field(..., description="S_time: Duration fit relative to weekly commitment (Weight: 5%)")
    feedback_rating_score: float = Field(..., description="S_fb: Feedback & rating quality (Weight: 10%)")
    final_score: float = Field(..., description="Composite weighted recommendation score (0.00 - 1.00)")


class RecommendedCourse(BaseModel):
    id: str
    title: str
    provider: str
    description: str
    difficulty: str
    duration_hours: int
    rating: float
    url: str
    cost: float
    skills_covered: List[str] = []
    score_breakdown: ScoreBreakdown
    match_percentage: float


class RecommendResponse(BaseModel):
    status: str = "success"
    goal_id: str
    user_id: str
    target_role: str
    total_evaluated: int
    recommendations: List[RecommendedCourse]


def calculate_difficulty_factor(user_exp: str, course_diff: str) -> float:
    """Calculate S_diff based on distance between user level and course difficulty."""
    levels = {"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}
    u_val = levels.get(user_exp.lower(), 2)
    c_val = levels.get(course_diff.lower(), 2)
    
    delta = c_val - u_val
    if delta == 0:
        return 1.00
    elif delta == 1:
        return 0.88   # Slight upward stretch (ideal for learning)
    elif delta == -1:
        return 0.70   # Slight refresher
    elif delta == 2:
        return 0.50   # Steep learning curve
    elif delta == -2:
        return 0.40   # Too basic
    else:
        return 0.20


def calculate_time_fit(duration_hours: int, weekly_hours: int, timeline_weeks: int) -> float:
    """Calculate S_time fit: checks if course duration aligns well with pacing."""
    total_available_hours = max(10, weekly_hours * max(1, timeline_weeks))
    ratio = duration_hours / total_available_hours
    
    # Ideal course duration takes between 15% and 50% of the entire study period
    if 0.05 <= ratio <= 0.60:
        return 1.00 - abs(ratio - 0.25)
    elif ratio < 0.05:
        return 0.70   # Very short course
    else:
        # Overly long course for timeline
        return max(0.20, 1.00 - (ratio - 0.60) * 1.5)


def build_goal_query_text(target_role: str, target_skills: List[str]) -> str:
    """Create the strict role + skills semantic query used for pgvector retrieval."""
    skills_text = " ".join(skill.strip() for skill in target_skills if skill and skill.strip())
    return f"{target_role or ''} {skills_text}".strip()


def is_data_analytics_goal(target_role: str, target_skills: List[str]) -> bool:
    goal_text = f"{target_role or ''} {' '.join(target_skills or [])}".lower()
    return any(
        keyword in goal_text
        for keyword in [
            "data analyst",
            "business intelligence",
            "power bi",
            "powerbi",
            "analytics",
            "pandas",
            "statistics"
        ]
    )


def allows_frontend_courses(target_skills: List[str]) -> bool:
    skills_text = " ".join(target_skills or []).lower()
    return any(
        keyword in skills_text
        for keyword in ["react", "tailwind", "frontend", "front-end", "css", "javascript", "typescript"]
    )


def build_keyword_patterns(target_role: str, target_skills: List[str], data_analytics_goal: bool) -> List[str]:
    keywords = []
    if data_analytics_goal:
        keywords.extend(["SQL", "Data", "Analytics", "Pandas", "Visualization", "Statistics", "Power BI", "PowerBI", "Business Intelligence"])

    for value in [target_role, *(target_skills or [])]:
        for token in (value or "").replace("&", " ").replace("/", " ").split():
            clean_token = token.strip(" ,.;:()[]{}").strip()
            if len(clean_token) >= 3:
                keywords.append(clean_token)

    return [f"%{keyword}%" for keyword in dict.fromkeys(keywords)]


def course_skill_matches_target(course_skill: str, target_skills: List[str]) -> bool:
    if not target_skills:
        return True

    course_text = (course_skill or "").lower()
    target_texts = [(skill or "").lower() for skill in target_skills]
    aliases = {
        "sql": ["sql", "postgresql", "relational db", "relational database"],
        "powerbi": ["powerbi", "power bi", "business intelligence", "bi"],
        "business intelligence": ["powerbi", "power bi", "business intelligence", "bi"],
        "data analytics": ["data analytics", "analytics", "analyst", "analytical"],
        "statistics": ["statistics", "statistical", "machine learning foundations"],
        "pandas": ["pandas", "python programming"]
    }

    for target_text in target_texts:
        if target_text and (target_text in course_text or course_text in target_text):
            return True
        for key, values in aliases.items():
            if target_text == key or any(value in target_text for value in values):
                if any(value in course_text for value in values):
                    return True
    return False


def fetch_keyword_courses(
    cur,
    keyword_patterns: List[str],
    data_skill_patterns: List[str],
    frontend_patterns: List[str],
    frontend_allowed: bool,
    limit: int,
    exclude_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    if not keyword_patterns:
        return []

    cur.execute("""
        SELECT
            c.id,
            c.title,
            c.provider,
            c.description,
            c.difficulty,
            c.duration_hours,
            c.rating,
            c.url,
            c.cost,
            0.35 AS semantic_similarity,
            1 AS keyword_match,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'skill_id', cs.skill_id,
                        'skill_name', s.name,
                        'proficiency_level', cs.proficiency_level,
                        'gap_weight', cs.gap_weight
                    )
                ) FILTER (WHERE cs.skill_id IS NOT NULL), '[]'
            ) AS mapped_skills
        FROM courses c
        LEFT JOIN course_skills cs ON c.id = cs.course_id
        LEFT JOIN skills s ON cs.skill_id = s.id
        WHERE NOT (c.id = ANY(%s::uuid[]))
          AND (
              c.title ILIKE ANY(%s)
              OR c.description ILIKE ANY(%s)
              OR s.name ILIKE ANY(%s)
              OR s.name ILIKE ANY(%s)
          )
          AND (
              %s
              OR NOT (
                  c.title ILIKE ANY(%s)
                  OR c.description ILIKE ANY(%s)
                  OR s.name ILIKE ANY(%s)
              )
          )
        GROUP BY c.id, c.title, c.provider, c.description, c.difficulty, c.duration_hours, c.rating, c.url, c.cost
        ORDER BY
            CASE
                WHEN c.title ILIKE ANY(%s) THEN 0
                WHEN s.name ILIKE ANY(%s) THEN 1
                ELSE 2
            END,
            c.rating DESC,
            c.duration_hours ASC
        LIMIT %s;
    """, (
        exclude_ids or [],
        keyword_patterns,
        keyword_patterns,
        keyword_patterns,
        data_skill_patterns,
        frontend_allowed,
        frontend_patterns,
        frontend_patterns,
        frontend_patterns,
        keyword_patterns,
        data_skill_patterns,
        limit
    ))
    return cur.fetchall()


@router.post("/recommend", response_model=RecommendResponse)
def get_recommendations(request: RecommendRequest):
    """
    Generate top personalized course recommendations using 384-dimensional vector similarity
    and multi-factor ranking (Skill Gaps, Semantic Cosine, Prerequisites, Difficulty, Time, Feedback).
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Resolve User & Goal
            user_id = request.user_id
            goal_id = request.goal_id

            if not user_id:
                cur.execute("SELECT id, experience_level FROM users LIMIT 1;")
                u_row = cur.fetchone()
                if not u_row:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="No user found. Please provide a valid user_id before requesting recommendations."
                    )
                user_id = str(u_row["id"])
                user_exp = u_row["experience_level"] if u_row else "intermediate"
            else:
                cur.execute("SELECT experience_level FROM users WHERE id = %s;", (user_id,))
                u_row = cur.fetchone()
                user_exp = u_row["experience_level"] if u_row else "intermediate"

            if not goal_id:
                cur.execute("SELECT * FROM goals WHERE user_id = %s ORDER BY created_at DESC LIMIT 1;", (user_id,))
                g_row = cur.fetchone()
                if not g_row:
                    cur.execute("SELECT * FROM goals LIMIT 1;")
                    g_row = cur.fetchone()
            else:
                cur.execute("SELECT * FROM goals WHERE id = %s;", (goal_id,))
                g_row = cur.fetchone()

            if not g_row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No goal found for this user. Please parse a goal first via POST /ai/parse-goal."
                )

            goal_id = str(g_row["id"])
            target_role = request.target_role or g_row["target_role"]
            target_skills = request.target_skills or []
            weekly_hours = g_row["weekly_study_hours"] or 10
            timeline_months = g_row["target_timeline_months"] or 3
            timeline_weeks = timeline_months * 4

            # 2. Fetch User's Current Skills
            cur.execute("""
                SELECT skill_id, proficiency_level, verified 
                FROM user_skills 
                WHERE user_id = %s;
            """, (user_id,))
            user_skills_map = {str(r["skill_id"]): r["proficiency_level"] for r in cur.fetchall()}

            # 3. Fetch User's Passed Assessments / Completed Prereqs
            cur.execute("""
                SELECT skill_id 
                FROM assessments 
                WHERE user_id = %s AND passed = true;
            """, (user_id,))
            passed_skill_ids = {str(r["skill_id"]) for r in cur.fetchall()}

            # 4. Generate Semantic Query Vector for Goal
            semantic_query = build_goal_query_text(target_role, target_skills)
            query_embedding_str = None
            try:
                query_embedding = encode_text(semantic_query)
                query_embedding_str = "[" + ",".join(f"{val:.6f}" for val in query_embedding) + "]"
            except Exception as encode_error:
                print(f"⚠️ Failed to encode recommendation query; using keyword fallback: {encode_error}")

            # 5. Fetch Courses, Mapped Skills, Prerequisites, and Cosine Distance
            limit = request.limit or 10
            data_analytics_goal = is_data_analytics_goal(target_role, target_skills)
            frontend_allowed = allows_frontend_courses(target_skills)
            data_keyword_pattern = r"\m(sql|analytics?|analytical|pandas|visuali[sz]ation|statistics|statistical|power[[:space:]]?bi|business intelligence|time-series|dashboards?)\M"
            data_skill_patterns = [
                "%SQL%",
                "%PostgreSQL%",
                "%Relational DB%",
                "%Analytics%",
                "%Pandas%",
                "%Visualization%",
                "%Statistics%",
                "%Power BI%",
                "%PowerBI%",
                "%Business Intelligence%",
                "%Machine Learning Foundations%"
            ]
            frontend_patterns = ["%Tailwind%", "%React%", "%Frontend%", "%Front-end%", "%CSS%"]
            keyword_patterns = build_keyword_patterns(target_role, target_skills, data_analytics_goal)
            all_courses = []

            try:
                if not query_embedding_str:
                    raise RuntimeError("No query embedding available for vector similarity search")

                cur.execute("""
                    WITH ranked_courses AS (
                        SELECT
                            c.*,
                            1 - (c.embedding <=> %s::vector) AS semantic_similarity,
                            CASE
                                WHEN %s AND (
                                    c.title ~* %s
                                    OR c.description ~* %s
                                    OR EXISTS (
                                        SELECT 1
                                        FROM course_skills keyword_cs
                                        JOIN skills keyword_s ON keyword_s.id = keyword_cs.skill_id
                                        WHERE keyword_cs.course_id = c.id
                                          AND keyword_s.name ILIKE ANY(%s)
                                    )
                                ) THEN 1
                                ELSE 0
                            END AS keyword_match
                        FROM courses c
                        WHERE c.embedding IS NOT NULL
                          AND (
                              NOT %s
                              OR (
                                  c.title ~* %s
                                  OR c.description ~* %s
                                  OR EXISTS (
                                      SELECT 1
                                      FROM course_skills required_keyword_cs
                                      JOIN skills required_keyword_s ON required_keyword_s.id = required_keyword_cs.skill_id
                                      WHERE required_keyword_cs.course_id = c.id
                                        AND required_keyword_s.name ILIKE ANY(%s)
                                  )
                              )
                          )
                          AND (
                              %s
                              OR NOT (
                                  c.title ILIKE ANY(%s)
                                  OR c.description ILIKE ANY(%s)
                                  OR EXISTS (
                                      SELECT 1
                                      FROM course_skills frontend_cs
                                      JOIN skills frontend_s ON frontend_s.id = frontend_cs.skill_id
                                      WHERE frontend_cs.course_id = c.id
                                        AND frontend_s.name ILIKE ANY(%s)
                                  )
                              )
                          )
                        ORDER BY c.embedding <=> %s::vector
                        LIMIT 12
                    )
                    SELECT
                        rc.id,
                        rc.title,
                        rc.provider,
                        rc.description,
                        rc.difficulty,
                        rc.duration_hours,
                        rc.rating,
                        rc.url,
                        rc.cost,
                        rc.semantic_similarity,
                        rc.keyword_match,
                        COALESCE(
                            json_agg(
                                DISTINCT jsonb_build_object(
                                    'skill_id', cs.skill_id,
                                    'skill_name', s.name,
                                    'proficiency_level', cs.proficiency_level,
                                    'gap_weight', cs.gap_weight
                                )
                            ) FILTER (WHERE cs.skill_id IS NOT NULL), '[]'
                        ) AS mapped_skills
                    FROM ranked_courses rc
                    LEFT JOIN course_skills cs ON rc.id = cs.course_id
                    LEFT JOIN skills s ON cs.skill_id = s.id
                    GROUP BY rc.id, rc.title, rc.provider, rc.description, rc.difficulty, rc.duration_hours, rc.rating, rc.url, rc.cost, rc.semantic_similarity, rc.keyword_match
                    ORDER BY rc.keyword_match DESC, rc.semantic_similarity DESC;
                """, (
                    query_embedding_str,
                    data_analytics_goal,
                    data_keyword_pattern,
                    data_keyword_pattern,
                    data_skill_patterns,
                    data_analytics_goal,
                    data_keyword_pattern,
                    data_keyword_pattern,
                    data_skill_patterns,
                    frontend_allowed,
                    frontend_patterns,
                    frontend_patterns,
                    frontend_patterns,
                    query_embedding_str
                ))
                all_courses = cur.fetchall()
            except Exception as vector_error:
                conn.rollback()
                print(f"⚠️ Vector recommendation search failed; falling back to keyword matching: {vector_error}")
                with conn.cursor() as fallback_cur:
                    all_courses = fetch_keyword_courses(
                        fallback_cur,
                        keyword_patterns,
                        data_skill_patterns,
                        frontend_patterns,
                        frontend_allowed,
                        max(int(limit), 12)
                    )

            if len(all_courses) < 5:
                existing_ids = [str(course["id"]) for course in all_courses]
                keyword_courses = fetch_keyword_courses(
                    cur,
                    keyword_patterns,
                    data_skill_patterns,
                    frontend_patterns,
                    frontend_allowed,
                    max(5 - len(all_courses), int(limit)),
                    existing_ids
                )
                all_courses = list(all_courses) + list(keyword_courses)

            # 6. Fetch Prerequisites Graph for all courses
            cur.execute("SELECT course_id, prerequisite_course_id, is_mandatory FROM course_prerequisites;")
            prereqs_by_course: Dict[str, List[Dict[str, Any]]] = {}
            for p in cur.fetchall():
                cid = str(p["course_id"])
                if cid not in prereqs_by_course:
                    prereqs_by_course[cid] = []
                prereqs_by_course[cid].append({
                    "prereq_id": str(p["prerequisite_course_id"]),
                    "mandatory": p["is_mandatory"]
                })

            # 7. Fetch User Feedback History
            cur.execute("SELECT AVG(rating) as avg_rating FROM user_feedback WHERE user_id = %s;", (user_id,))
            fb_row = cur.fetchone()
            user_avg_feedback = float(fb_row["avg_rating"]) if (fb_row and fb_row["avg_rating"]) else None

            # 8. Score Each Course Using Multi-Factor Formula
            scored_courses = []

            for course in all_courses:
                cid = str(course["id"])
                
                # S_sem: Semantic Cosine Similarity from pgvector (1 - cosine_distance)
                s_sem = max(0.0, min(1.0, float(course["semantic_similarity"] or 0.0)))

                # S_gap: Skill Gap Coverage for the goal's target skills
                mapped_skills = course["mapped_skills"]
                skills_list = []
                gap_addressed_sum = 0.0
                total_target_gap = 0.0

                for sk in mapped_skills:
                    sk_id = str(sk["skill_id"])
                    sk_name = sk["skill_name"]
                    target_lvl = int(sk["proficiency_level"])
                    weight = float(sk["gap_weight"]) if sk["gap_weight"] else 0.5
                    current_lvl = user_skills_map.get(sk_id, 1)

                    skills_list.append(sk_name)
                    if not course_skill_matches_target(sk_name, target_skills):
                        continue
                    
                    # Target gap for this skill
                    sk_gap = max(0, target_lvl - current_lvl)
                    total_target_gap += max(1.0, float(target_lvl)) * weight
                    gap_addressed_sum += float(sk_gap) * weight

                if total_target_gap > 0:
                    s_gap = min(1.0, max(0.1, gap_addressed_sum / total_target_gap))
                else:
                    s_gap = 0.50

                # S_pre: Prerequisite Fulfillment
                course_prereqs = prereqs_by_course.get(cid, [])
                if not course_prereqs:
                    s_pre = 1.00
                else:
                    fulfilled = 0
                    for pr in course_prereqs:
                        # Check if user has passed skill or finished prereq
                        if pr["prereq_id"] in user_skills_map or any(sk["skill_id"] in passed_skill_ids for sk in mapped_skills):
                            fulfilled += 1
                    s_pre = fulfilled / len(course_prereqs)

                # S_diff: Difficulty Match
                s_diff = calculate_difficulty_factor(user_exp, course["difficulty"])

                # S_time: Time Commitment Fit
                s_time = calculate_time_fit(
                    int(course["duration_hours"]),
                    int(weekly_hours),
                    int(timeline_weeks)
                )

                # S_fb: User Feedback & Rating Normalization
                course_rating = float(course["rating"]) if course["rating"] else 4.5
                norm_rating = min(1.0, max(0.5, course_rating / 5.0))
                if user_avg_feedback is not None:
                    s_fb = (norm_rating * 0.7) + ((user_avg_feedback / 5.0) * 0.3)
                else:
                    s_fb = norm_rating

                # Composite Formula:
                # Score(c) = 0.25 * S_gap + 0.40 * S_sem + 0.10 * S_pre + 0.10 * S_diff + 0.05 * S_time + 0.10 * S_fb
                final_score = (
                    (0.25 * s_gap) +
                    (0.40 * s_sem) +
                    (0.10 * s_pre) +
                    (0.10 * s_diff) +
                    (0.05 * s_time) +
                    (0.10 * s_fb)
                )
                if data_analytics_goal and course["keyword_match"]:
                    final_score = min(1.0, final_score + 0.15)

                breakdown = ScoreBreakdown(
                    skill_gap_score=round(s_gap, 4),
                    semantic_similarity=round(s_sem, 4),
                    prerequisite_fit=round(s_pre, 4),
                    difficulty_match=round(s_diff, 4),
                    time_fit=round(s_time, 4),
                    feedback_rating_score=round(s_fb, 4),
                    final_score=round(final_score, 4)
                )

                scored_courses.append(
                    RecommendedCourse(
                        id=cid,
                        title=course["title"],
                        provider=course["provider"],
                        description=course["description"],
                        difficulty=course["difficulty"],
                        duration_hours=int(course["duration_hours"]),
                        rating=float(course["rating"]),
                        url=course["url"],
                        cost=float(course["cost"]),
                        skills_covered=skills_list,
                        score_breakdown=breakdown,
                        match_percentage=round(final_score * 100, 1)
                    )
                )

            # 9. Sort by Final Score Descending after strict vector retrieval and goal keyword boost.
            scored_courses.sort(
                key=lambda x: (
                    x.score_breakdown.final_score,
                    x.score_breakdown.semantic_similarity
                ),
                reverse=True
            )
            limit = request.limit or 10
            top_recommendations = scored_courses[:limit]

            return RecommendResponse(
                status="success",
                goal_id=goal_id,
                user_id=user_id,
                target_role=target_role,
                total_evaluated=len(all_courses),
                recommendations=top_recommendations
            )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing recommendations: {str(e)}"
        )
    finally:
        conn.close()
