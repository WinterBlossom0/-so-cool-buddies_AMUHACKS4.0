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

# Import route modules
from routers import weather, air_quality, sensors, waste, solar, transit, reports, alerts, chatbot, traffic

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO if os.getenv("DEBUG") == "True" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("smart_city")

# Validate critical environment variables
required_keys = ["GEMINI_API_KEY", "TOMTOM_API_KEY", "OPENEI_SOLAR_API_KEY"]
missing_keys = [key for key in required_keys if not os.getenv(key) or os.getenv(key) == f"your_{key.lower()}"]
if missing_keys:
    logger.warning(f"Missing or invalid environment variables: {', '.join(missing_keys)}")
    logger.warning("Some features may not work correctly. Please check your .env file.")

app = FastAPI(title="Smart City API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/")
async def root():
    return {"message": "Smart City API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)