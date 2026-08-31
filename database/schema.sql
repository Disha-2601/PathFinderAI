-- PathFinder AI - Comprehensive PostgreSQL / Supabase Schema (Stage 2)
-- Enables vector search, relational pathways, skill gaps, and assessment tracking

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Custom Enumeration Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'professional', 'mentor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_status AS ENUM ('active', 'paused', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE learning_style AS ENUM ('visual', 'hands_on_projects', 'reading_theory', 'mixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_status AS ENUM ('pending', 'in_progress', 'passed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Core Tables

-- 3.1 Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    target_role VARCHAR(255),
    experience_level VARCHAR(100) DEFAULT 'beginner',
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 Goals Table (User Career / Pathway Goals)
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_role VARCHAR(255) NOT NULL,
    target_timeline_months INT DEFAULT 6,
    weekly_study_hours INT DEFAULT 10,
    preferred_learning_style learning_style DEFAULT 'hands_on_projects',
    status goal_status DEFAULT 'active',
    current_step INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 Skills Table (Taxonomy & Categorization)
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.4 Courses Table (With 384-dimensional vector embedding for semantic search)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    difficulty course_difficulty DEFAULT 'intermediate',
    duration_hours INT NOT NULL DEFAULT 10,
    rating NUMERIC(3, 2) DEFAULT 4.50 CHECK (rating >= 0 AND rating <= 5.00),
    url TEXT NOT NULL,
    cost NUMERIC(10, 2) DEFAULT 0.00,
    embedding vector(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.5 Course Skills Junction (Proficiency impact and gap weight)
CREATE TABLE IF NOT EXISTS course_skills (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INT NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
    gap_weight NUMERIC(3, 2) DEFAULT 0.50 CHECK (gap_weight >= 0.00 AND gap_weight <= 1.00),
    PRIMARY KEY (course_id, skill_id)
);

-- 3.6 Course Prerequisites (Directed Acyclic Graph of learning pathways)
CREATE TABLE IF NOT EXISTS course_prerequisites (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT true,
    PRIMARY KEY (course_id, prerequisite_course_id),
    CHECK (course_id <> prerequisite_course_id)
);

-- 3.7 User Skills Profile (Current ratings & verified mastery)
CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INT DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
    verified BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id)
);

-- 3.8 User Feedback
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    relevance_score NUMERIC(3, 2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.9 Assessments Table (Skill verification tests & diagnostic results)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    score INT DEFAULT 0,
    max_score INT DEFAULT 100,
    status assessment_status DEFAULT 'pending',
    passed BOOLEAN DEFAULT false,
    assessment_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. High Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_course_skills_skill ON course_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_course_prereqs_prereq ON course_prerequisites(prerequisite_course_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_skill ON assessments(user_id, skill_id);

-- 5. HNSW Vector Index for 384-dimensional cosine semantic search
CREATE INDEX IF NOT EXISTS idx_courses_embedding_hnsw 
ON courses USING hnsw (embedding vector_cosine_ops);
