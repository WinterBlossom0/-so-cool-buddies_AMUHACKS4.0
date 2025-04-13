from fastapi import APIRouter, HTTPException, Query
import os
import httpx
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/weather",
    tags=["weather"],
    responses={404: {"description": "Not found"}},
)

# Get API key from environment variable with no default
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074")
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")
DEFAULT_CITY = os.getenv("DEFAULT_CITY", "London")

@router.get("/current")
async def get_current_weather(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON), city: str = DEFAULT_CITY):
    """Get current weather data for a location"""
    # Require valid API key
    if not OPENWEATHERMAP_API_KEY:
        return JSONResponse(
            status_code=500,
            content={"error": "Weather API key not configured"}
        )
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": OPENWEATHERMAP_API_KEY,
                    "units": "metric"
                }
            )
            
            if response.status_code != 200:
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Weather API error: {response.text}",
                        "coordinates": {"lat": lat, "lon": lon}
                    }
                )
                
            data = response.json()
            
            result = {
                "location": {
                    "name": city if city else data.get("name", "Unknown"),
                    "lat": lat,
                    "lon": lon,
                },
                "current": {
                    "temp_c": data["main"]["temp"],
                    "feels_like_c": data["main"]["feels_like"],
                    "humidity": data["main"]["humidity"],
                    "pressure": data["main"]["pressure"],
                    "wind_kph": data["wind"]["speed"] * 3.6,  # Convert m/s to km/h
                    "condition": data["weather"][0]["main"],
                    "description": data["weather"][0]["description"],
                    "icon": data["weather"][0]["icon"],
                    "last_updated": datetime.now().isoformat()
                }
            }
            
            return result
    except Exception as e:
        # Return error instead of synthetic data
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Failed to fetch weather data: {str(e)}",
                "coordinates": {"lat": lat, "lon": lon}
            }
        )

@router.get("/forecast")
async def get_weather_forecast(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON), city: str = DEFAULT_CITY, iterate: bool = Query(False, description="Enable iterative data improvements")):
    """Get 5-day weather forecast for a location"""
    # Require valid API key
    if not OPENWEATHERMAP_API_KEY:
        return JSONResponse(
            status_code=500,
            content={"error": "Weather API key not configured"}
        )
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.openweathermap.org/data/2.5/forecast",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": OPENWEATHERMAP_API_KEY,
                    "units": "metric"
                }
            )
            
            if response.status_code != 200:
                # Return error response instead of fallback when API key exists
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Weather API error: {response.text}",
                        "coordinates": {"lat": lat, "lon": lon}
                    }
                )
                
            data = response.json()
            
            # Process 5-day forecast data (OpenWeatherMap returns data in 3-hour steps)
            daily_data = {}
            for item in data["list"]:
                date = item["dt_txt"].split(" ")[0]
                if date not in daily_data:
                    daily_data[date] = {
                        "temps": [],
                        "conditions": [],
                        "rain_probs": [],
                        "wind_speeds": [] if iterate else None,
                        "humidities": [] if iterate else None,
                        "pressures": [] if iterate else None
                    }
                daily_data[date]["temps"].append(item["main"]["temp"])
                daily_data[date]["conditions"].append(item["weather"][0]["main"])
                daily_data[date]["rain_probs"].append(item.get("pop", 0) * 100)  # Convert from 0-1 to percentage
                
                # Additional data points if iterate=True
                if iterate:
                    daily_data[date]["wind_speeds"].append(item["wind"]["speed"] * 3.6)  # Convert m/s to km/h
                    daily_data[date]["humidities"].append(item["main"]["humidity"])
                    daily_data[date]["pressures"].append(item["main"]["pressure"])
            
            forecast = []
            for date, info in daily_data.items():
                forecast_item = {
                    "date": date,
                    "max_temp_c": round(max(info["temps"]), 1),
                    "min_temp_c": round(min(info["temps"]), 1),
                    "condition": max(set(info["conditions"]), key=info["conditions"].count),  # Most common condition
                    "chance_of_rain": round(max(info["rain_probs"]))
                }
                
                # Add additional forecast data if iterate=True
                if iterate:
                    forecast_item.update({
                        "avg_wind_kph": round(sum(info["wind_speeds"]) / len(info["wind_speeds"]), 1),
                        "avg_humidity": round(sum(info["humidities"]) / len(info["humidities"])),
                        "avg_pressure": round(sum(info["pressures"]) / len(info["pressures"]))
                    })
                
                forecast.append(forecast_item)
            
            return {
                "location": {
                    "name": city if city else data.get("city", {}).get("name", "Unknown"),
                    "lat": lat,
                    "lon": lon,
                },
                "forecast": forecast[:5]  # Limit to 5 days
            }
    except Exception as e:
        # Return error instead of synthetic data
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Failed to fetch weather forecast: {str(e)}",
                "coordinates": {"lat": lat, "lon": lon},
                "requested_city": city
            }
        )