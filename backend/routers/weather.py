from fastapi import APIRouter, HTTPException, Query
import os
import httpx
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/weather",
    tags=["weather"],
    responses={404: {"description": "Not found"}},
)

OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074")
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")
DEFAULT_CITY = os.getenv("DEFAULT_CITY", "London")

def generate_synthetic_weather_data(lat=DEFAULT_LAT, lon=DEFAULT_LON, city=DEFAULT_CITY, iterate=False):
    """Generate synthetic weather data if API key isn't available"""
    current_month = datetime.now().month
    
    # Adjust temperature ranges based on northern hemisphere seasons
    if 3 <= current_month <= 5:  # Spring
        temp_range = (10, 20)
    elif 6 <= current_month <= 8:  # Summer
        temp_range = (18, 30)
    elif 9 <= current_month <= 11:  # Fall
        temp_range = (5, 15)
    else:  # Winter
        temp_range = (-5, 10)
    
    conditions = ["Clear", "Clouds", "Rain", "Thunderstorm", "Snow", "Mist"]
    condition_weights = [0.3, 0.3, 0.2, 0.1, 0.05, 0.05]
    
    # If iterate is True, create more realistic and varied data
    if iterate:
        # Introduce more variance in temperature
        temp_range = (temp_range[0] - 2, temp_range[1] + 2)
        
        # Make conditions more dynamic based on time of day
        hour = datetime.now().hour
        if 6 <= hour <= 18:  # Daytime
            condition_weights = [0.4, 0.3, 0.15, 0.05, 0.05, 0.05]  # More likely to be clear
        else:  # Nighttime
            condition_weights = [0.2, 0.3, 0.25, 0.1, 0.05, 0.1]  # More likely clouds/rain
    
    temp = round(random.uniform(*temp_range), 1)
    feels_like = round(temp + random.uniform(-2, 2), 1)
    humidity = random.randint(30, 95)
    pressure = random.randint(995, 1025)
    wind_speed = round(random.uniform(0, 15), 1)
    condition = random.choices(conditions, weights=condition_weights)[0]
    
    # If iterate is True, add additional weather metrics for more comprehensive data
    current_data = {
        "temp_c": temp,
        "feels_like_c": feels_like,
        "humidity": humidity,
        "pressure": pressure,
        "wind_kph": wind_speed,
        "condition": condition,
        "last_updated": datetime.now().isoformat()
    }
    
    if iterate:
        current_data.update({
            "uv_index": round(random.uniform(0, 10), 1),
            "visibility_km": round(random.uniform(5, 20), 1),
            "precipitation_mm": round(random.uniform(0, 5), 1) if condition in ["Rain", "Thunderstorm"] else 0,
            "air_quality_index": random.randint(1, 100)
        })
    
    return {
        "location": {
            "name": city,
            "lat": float(lat),
            "lon": float(lon),
        },
        "current": current_data,
        "forecast": [
            {
                "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
                "max_temp_c": round(temp + random.uniform(-1, 5), 1),
                "min_temp_c": round(temp + random.uniform(-5, 1), 1),
                "condition": random.choices(conditions, weights=condition_weights)[0],
                "chance_of_rain": random.randint(0, 100) if "Rain" in condition else random.randint(0, 30)
            }
            for i in range(1, 6)  # 5-day forecast
        ]
    }

@router.get("/current")
async def get_current_weather(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON), city: str = DEFAULT_CITY, iterate: bool = Query(False, description="Enable iterative data improvements")):
    """Get current weather data for a location"""
    if not OPENWEATHERMAP_API_KEY or OPENWEATHERMAP_API_KEY == "your_openweathermap_api_key":
        # Return synthetic data if no API key
        return generate_synthetic_weather_data(lat, lon, city, iterate)
        
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
                # Fallback to synthetic data on API error
                return generate_synthetic_weather_data(lat, lon, city, iterate)
                
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
            
            # If iterate=True, add extended data where available
            if iterate and "visibility" in data:
                result["current"].update({
                    "visibility_km": data.get("visibility", 0) / 1000,  # Convert m to km
                })
                
            if iterate and "rain" in data:
                result["current"].update({
                    "precipitation_mm": data.get("rain", {}).get("1h", 0),  # 1h precipitation
                })
                
            return result
    except Exception as e:
        # Fallback to synthetic data on any error
        return generate_synthetic_weather_data(lat, lon, city, iterate)

@router.get("/forecast")
async def get_weather_forecast(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON), city: str = DEFAULT_CITY, iterate: bool = Query(False, description="Enable iterative data improvements")):
    """Get 5-day weather forecast for a location"""
    if not OPENWEATHERMAP_API_KEY or OPENWEATHERMAP_API_KEY == "your_openweathermap_api_key":
        # Return synthetic data if no API key
        return generate_synthetic_weather_data(lat, lon, city, iterate)
        
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
                # Fallback to synthetic data on API error
                return generate_synthetic_weather_data(lat, lon, city, iterate)
                
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
        # Fallback to synthetic data on any error
        return generate_synthetic_weather_data(lat, lon, city, iterate)