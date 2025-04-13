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

# Import route modules
from routers import weather, air_quality, sensors, waste, solar, transit, reports, alerts, chatbot, traffic

# Load environment variables
load_dotenv()

app = FastAPI(title="Smart City API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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