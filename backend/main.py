from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import random
import httpx
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from dotenv import load_dotenv
import logging
from fastapi.staticfiles import StaticFiles

# Import route modules
from routers import weather, air_quality, sensors, waste, solar, transit, reports, alerts, chatbot, traffic

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Configure API keys for all services - strictly use environment variables
API_KEYS = {
    "openweathermap": os.getenv("OPENWEATHERMAP_API_KEY"),
    "mapbox": os.getenv("MAPBOX_API_KEY"),
    "google_maps": os.getenv("GOOGLE_MAPS_API_KEY"),
}

# Print API status to ensure keys are loaded
for service, key in API_KEYS.items():
    if key:
        truncated_key = f"{key[:5]}...{key[-5:]}" if len(key) > 10 else key
        logger.info(f"{service.upper()} API key configured: {truncated_key}")
    else:
        logger.warning(f"{service.upper()} API key not configured.")

# Check for missing API keys
missing_keys = [service for service, key in API_KEYS.items() if not key]
if missing_keys:
    logger.warning(f"Missing API keys for: {', '.join(missing_keys)}.")
    logger.warning("Some features may not work correctly. Please check your .env file.")

app = FastAPI(
    title="Smart City API",
    description="Backend API for Smart City Dashboard",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be more restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler middleware
@app.middleware("http")
async def log_exceptions_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.url.path} - {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "message": str(e)}
        )

# Include routers
app.include_router(weather.router)
app.include_router(air_quality.router)
app.include_router(sensors.router)
app.include_router(waste.router)
app.include_router(solar.router)
app.include_router(transit.router)
app.include_router(reports.router)
app.include_router(alerts.router)
app.include_router(chatbot.router)
app.include_router(traffic.router)

# Mount static files (if needed)
@app.get("/")
async def root():
    return {"message": "Welcome to Smart City API. Visit /docs for API documentation."}

@app.get("/health")
async def health_check():
    """Health check endpoint that also returns API status"""
    return {
        "status": "ok",
        "api_status": {
            service: "configured" if key else "missing" 
            for service, key in API_KEYS.items()
        }
    }

@app.get("/api/debug")
async def api_debug():
    """Debug endpoint to check all API key statuses"""
    return {
        "api_keys": {
            "openweathermap": bool(API_KEYS["openweathermap"]),
            "mapbox": bool(API_KEYS["mapbox"]),
            "google_maps": bool(API_KEYS["google_maps"]),
            "openaq": bool(os.getenv("OPENAQ_API_KEY"))
        },
        "env_loaded": bool(os.getenv("DEFAULT_LAT")),
        "debug_mode": os.getenv("DEBUG") == "True",
        "timestamp": datetime.now().isoformat()
    }

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)