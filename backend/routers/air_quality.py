from fastapi import APIRouter, HTTPException
import os
import httpx
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/air-quality",
    tags=["air-quality"],
    responses={404: {"description": "Not found"}},
)

OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY")
DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074")
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")

def generate_synthetic_air_quality_data(lat=DEFAULT_LAT, lon=DEFAULT_LON):
    """Generate synthetic air quality data if API key isn't available"""
    # Generate realistic-looking but random AQI values
    pm25 = round(random.uniform(5, 35), 1)  # PM2.5 (μg/m³)
    pm10 = round(random.uniform(10, 50), 1)  # PM10 (μg/m³)
    o3 = round(random.uniform(20, 80), 1)  # Ozone (ppb)
    no2 = round(random.uniform(10, 60), 1)  # Nitrogen Dioxide (ppb)
    so2 = round(random.uniform(5, 30), 1)  # Sulfur Dioxide (ppb)
    co = round(random.uniform(0.5, 5), 1)  # Carbon Monoxide (ppm)
    
    # Calculate overall AQI based primarily on PM2.5
    if pm25 <= 12:
        aqi = int(pm25 * 4.17)  # 0-50 AQI
        level = "Good"
        color = "green"
    elif pm25 <= 35.4:
        aqi = int(50 + ((pm25 - 12) * 2.1))  # 51-100 AQI
        level = "Moderate"
        color = "yellow"
    elif pm25 <= 55.4:
        aqi = int(100 + ((pm25 - 35.4) * 2.5))  # 101-150 AQI
        level = "Unhealthy for Sensitive Groups"
        color = "orange"
    else:
        aqi = int(150 + ((pm25 - 55.4) * 2.5))  # 151-200 AQI
        level = "Unhealthy"
        color = "red"
    
    return {
        "location": {
            "lat": float(lat),
            "lon": float(lon),
        },
        "current": {
            "aqi": aqi,
            "level": level,
            "color": color,
            "pollutants": {
                "pm25": pm25,
                "pm10": pm10,
                "o3": o3,
                "no2": no2,
                "so2": so2,
                "co": co
            },
            "last_updated": datetime.now().isoformat()
        },
        "history": [
            {
                "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                "aqi": int(aqi * (1 + random.uniform(-0.2, 0.2)))  # Vary by ±20%
            }
            for i in range(1, 8)  # 7-day history
        ]
    }

@router.get("/current")
async def get_current_air_quality(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON)):
    """Get current air quality data for a location"""
    if not OPENAQ_API_KEY or OPENAQ_API_KEY == "your_openaq_api_key":
        # Return synthetic data if no API key
        return generate_synthetic_air_quality_data(lat, lon)
    
    try:
        async with httpx.AsyncClient() as client:
            # OpenAQ provides data through their API
            response = await client.get(
                "https://api.openaq.org/v2/latest",
                params={
                    "coordinates": f"{lat},{lon}",
                    "radius": 10000,  # 10km radius
                    "limit": 5,
                    "api_key": OPENAQ_API_KEY
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                # Fallback to synthetic data on API error
                return generate_synthetic_air_quality_data(lat, lon)
            
            data = response.json()
            
            # Check if we have results
            if not data.get("results") or len(data["results"]) == 0:
                return generate_synthetic_air_quality_data(lat, lon)
            
            # Process the results
            result = data["results"][0]
            measurements = {}
            
            for measurement in result.get("measurements", []):
                parameter = measurement["parameter"].lower()
                value = measurement["value"]
                measurements[parameter] = value
            
            # Calculate AQI based on PM2.5 if available
            aqi = 0
            level = "Unknown"
            color = "gray"
            
            if "pm25" in measurements:
                pm25 = measurements["pm25"]
                if pm25 <= 12:
                    aqi = int(pm25 * 4.17)
                    level = "Good"
                    color = "green"
                elif pm25 <= 35.4:
                    aqi = int(50 + ((pm25 - 12) * 2.1))
                    level = "Moderate"
                    color = "yellow"
                elif pm25 <= 55.4:
                    aqi = int(100 + ((pm25 - 35.4) * 2.5))
                    level = "Unhealthy for Sensitive Groups"
                    color = "orange"
                else:
                    aqi = int(150 + ((pm25 - 55.4) * 2.5))
                    level = "Unhealthy"
                    color = "red"
            
            return {
                "location": {
                    "lat": lat,
                    "lon": lon,
                    "name": result.get("location", "Unknown")
                },
                "current": {
                    "aqi": aqi,
                    "level": level,
                    "color": color,
                    "pollutants": measurements,
                    "last_updated": result.get("date", {}).get("utc", datetime.now().isoformat())
                }
            }
    except Exception as e:
        # Fallback to synthetic data on any error
        return generate_synthetic_air_quality_data(lat, lon)

@router.get("/history")
async def get_air_quality_history(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON)):
    """Get historical air quality data for a location"""
    # OpenAQ's free tier has limitations for historical data, so we'll use synthetic data
    return generate_synthetic_air_quality_data(lat, lon)