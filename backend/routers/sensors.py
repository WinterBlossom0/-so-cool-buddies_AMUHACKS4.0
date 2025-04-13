from fastapi import APIRouter, HTTPException
import os
import httpx
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/sensors",
    tags=["sensors"],
    responses={404: {"description": "Not found"}},
)

OPENSENSEMAP_API_KEY = os.getenv("OPENSENSEMAP_API_KEY")
DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074")
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")

def generate_synthetic_sensor_data(lat=DEFAULT_LAT, lon=DEFAULT_LON):
    """Generate synthetic sensor data if API key isn't available"""
    now = datetime.now()
    
    # Generate 5 sample sensors for the area
    sensor_types = [
        {"id": "temp_humidity", "name": "Temperature & Humidity Sensor", "type": "Environmental"},
        {"id": "air_quality", "name": "Air Quality Monitor", "type": "Environmental"},
        {"id": "noise", "name": "Noise Level Sensor", "type": "Environmental"},
        {"id": "traffic", "name": "Traffic Flow Counter", "type": "Traffic"},
        {"id": "parking", "name": "Parking Space Monitor", "type": "Urban"}
    ]
    
    sensors = []
    
    for i, sensor_type in enumerate(sensor_types):
        # Generate a position slightly offset from the center
        sensor_lat = float(lat) + random.uniform(-0.01, 0.01)
        sensor_lon = float(lon) + random.uniform(-0.01, 0.01)
        
        # Generate sensor-specific readings
        if sensor_type["id"] == "temp_humidity":
            readings = {
                "temperature": round(random.uniform(15, 25), 1),
                "humidity": round(random.uniform(30, 80), 1)
            }
        elif sensor_type["id"] == "air_quality":
            readings = {
                "pm25": round(random.uniform(5, 35), 1),
                "pm10": round(random.uniform(10, 50), 1)
            }
        elif sensor_type["id"] == "noise":
            readings = {
                "db_level": round(random.uniform(40, 90), 1)
            }
        elif sensor_type["id"] == "traffic":
            readings = {
                "vehicles_per_hour": random.randint(50, 1000),
                "average_speed": round(random.uniform(20, 60), 1)
            }
        else:  # parking
            spaces_total = random.randint(20, 50)
            spaces_occupied = random.randint(0, spaces_total)
            readings = {
                "spaces_total": spaces_total,
                "spaces_occupied": spaces_occupied,
                "spaces_available": spaces_total - spaces_occupied
            }
        
        # Generate history data (24 hours, hourly)
        history = []
        for h in range(24):
            timestamp = (now - timedelta(hours=h)).isoformat()
            sensor_history = {"timestamp": timestamp}
            
            # Add slightly varying values for each reading
            for key, value in readings.items():
                if isinstance(value, int):
                    variation = random.uniform(0.8, 1.2)  # ±20%
                    sensor_history[key] = int(value * variation)
                else:
                    variation = random.uniform(-3, 3) if "temperature" in key else random.uniform(0.8, 1.2)
                    sensor_history[key] = round(value + variation, 1) if "temperature" in key else round(value * variation, 1)
            
            history.append(sensor_history)
        
        sensors.append({
            "id": f"sensor-{i+1}",
            "name": sensor_type["name"],
            "type": sensor_type["type"],
            "location": {
                "lat": sensor_lat,
                "lon": sensor_lon
            },
            "status": "active",
            "battery": random.randint(50, 100),
            "last_updated": now.isoformat(),
            "readings": readings,
            "history": history
        })
    
    return {
        "count": len(sensors),
        "sensors": sensors
    }

@router.get("/")
async def get_sensors(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON)):
    """Get all sensors in the vicinity"""
    if not OPENSENSEMAP_API_KEY or OPENSENSEMAP_API_KEY == "your_opensensemap_api_key":
        # Return synthetic data if no API key
        return generate_synthetic_sensor_data(lat, lon)
    
    try:
        async with httpx.AsyncClient() as client:
            # OpenSenseMap provides sensor data through their API
            response = await client.get(
                "https://api.opensensemap.org/boxes",
                params={
                    "near": f"{lon},{lat}",  # Note: OpenSenseMap uses lon,lat order
                    "maxDistance": 5000,  # 5km radius
                    "limit": 10
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                # Fallback to synthetic data on API error
                return generate_synthetic_sensor_data(lat, lon)
            
            data = response.json()
            
            # Process the results
            sensors = []
            for box in data:
                sensor_data = {
                    "id": box.get("_id", "unknown"),
                    "name": box.get("name", "Unknown Sensor"),
                    "type": "Environmental",  # Default type
                    "location": {
                        "lat": box.get("currentLocation", {}).get("coordinates", [0, 0])[1],
                        "lon": box.get("currentLocation", {}).get("coordinates", [0, 0])[0]
                    },
                    "status": "active",
                    "last_updated": box.get("updatedAt", datetime.now().isoformat()),
                    "readings": {}
                }
                
                # Extract the latest sensor readings
                for sensor in box.get("sensors", []):
                    if "lastMeasurement" in sensor and sensor["lastMeasurement"]:
                        reading_key = sensor.get("title", "unknown").lower().replace(" ", "_")
                        reading_value = sensor["lastMeasurement"].get("value")
                        if reading_value:
                            try:
                                sensor_data["readings"][reading_key] = float(reading_value)
                            except (ValueError, TypeError):
                                sensor_data["readings"][reading_key] = reading_value
                
                sensors.append(sensor_data)
            
            return {
                "count": len(sensors),
                "sensors": sensors
            }
            
    except Exception as e:
        # Fallback to synthetic data on any error
        return generate_synthetic_sensor_data(lat, lon)

@router.get("/{sensor_id}")
async def get_sensor_details(sensor_id: str, lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON)):
    """Get detailed information about a specific sensor"""
    # For simplicity, we'll use synthetic data since most users won't have API keys
    sensors = generate_synthetic_sensor_data(lat, lon)["sensors"]
    
    # Find the sensor with the matching ID
    for sensor in sensors:
        if sensor["id"] == sensor_id:
            return sensor
    
    # If not found, throw a 404
    raise HTTPException(status_code=404, detail=f"Sensor {sensor_id} not found")