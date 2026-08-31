import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers.parse import router as parse_router
from app.routers.recommend import router as recommend_router

load_dotenv()

app = FastAPI(
    title="PathFinder AI Service",
    description="Microservice powering intelligent pathway generation, semantic embeddings, natural language goal parsing, and multi-factor recommendation graphs",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(parse_router)
app.include_router(recommend_router)


@app.get("/")
def read_root():
    return {
        "name": "PathFinder AI Service",
        "version": "1.0.0",
        "status": "online",
        "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        "endpoints": {
            "health": "/health",
            "parse_goal": "POST /ai/parse-goal",
            "recommend": "POST /ai/recommend",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model_configured": os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
