from fastapi import APIRouter, HTTPException
import os
import httpx
from dotenv import load_dotenv
import random
import zipfile
import io
import csv
from datetime import datetime, timedelta
import math

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/transit",
    tags=["transit"],
    responses={404: {"description": "Not found"}},
)

DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074")
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")

# In-memory cache for transit data
transit_data_cache = {}

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the distance between two coordinates in km using Haversine formula"""
    R = 6371  # Radius of the Earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    return distance

def generate_synthetic_transit_data(lat=DEFAULT_LAT, lon=DEFAULT_LON):
    """Generate synthetic transit data"""
    lat, lon = float(lat), float(lon)
    
    # Generate routes
    route_types = {
        0: "Tram/Light Rail",
        1: "Subway/Metro",
        2: "Rail",
        3: "Bus",
        4: "Ferry",
    }
    
    routes = []
    for i in range(1, 11):  # Generate 10 routes
        route_type = random.choice(list(route_types.keys()))
        route_color = ''.join([random.choice('0123456789ABCDEF') for _ in range(6)])
        
        route = {
            "id": f"route-{i}",
            "name": f"Route {i}",
            "short_name": f"R{i}",
            "type": route_types[route_type],
            "type_id": route_type,
            "color": route_color,
            "text_color": "FFFFFF" if int(route_color[:2], 16) < 128 else "000000",
            "description": f"A {route_types[route_type]} route serving the city center and suburbs",
            "url": f"https://example.com/routes/{i}",
            "stops": []
        }
        
        # Generate stops for this route
        num_stops = random.randint(5, 15)
        for j in range(1, num_stops + 1):
            # Generate stop coordinates with small offsets from the center
            stop_lat = lat + random.uniform(-0.02, 0.02)
            stop_lon = lon + random.uniform(-0.02, 0.02)
            
            # Generate arrival times (next 3 arrivals)
            now = datetime.now()
            arrivals = []
            for k in range(3):
                minutes_from_now = (j * 2) + (k * 10) + random.randint(0, 5)
                arrival_time = now + timedelta(minutes=minutes_from_now)
                arrivals.append({
                    "scheduled": arrival_time.strftime("%H:%M"),
                    "estimated": (arrival_time + timedelta(minutes=random.uniform(-2, 5))).strftime("%H:%M"),
                    "delay": random.choice([0, 0, 0, 1, 2, -1])  # Most services are on time
                })
            
            stop = {
                "id": f"stop-{i}-{j}",
                "name": f"Stop {j} on Route {i}",
                "location": {
                    "lat": stop_lat,
                    "lon": stop_lon
                },
                "next_arrivals": arrivals,
                "accessible": random.choice([True, True, False]),  # 2/3 chance of being accessible
                "has_shelter": random.choice([True, False])
            }
            
            route["stops"].append(stop)
        
        routes.append(route)
    
    # Cache the data
    transit_data_cache["data"] = {
        "count": len(routes),
        "routes": routes,
        "generated": datetime.now().isoformat()
    }
    
    return transit_data_cache["data"]

@router.get("/routes")
async def get_transit_routes(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON), refresh: bool = False):
    """Get transit routes in the vicinity"""
    if refresh or "data" not in transit_data_cache:
        return generate_synthetic_transit_data(lat, lon)
    return transit_data_cache["data"]

@router.get("/routes/{route_id}")
async def get_route_details(route_id: str):
    """Get detailed information about a specific transit route"""
    if "data" not in transit_data_cache:
        generate_synthetic_transit_data()
    
    for route in transit_data_cache["data"]["routes"]:
        if route["id"] == route_id:
            return route
    
    raise HTTPException(status_code=404, detail=f"Route {route_id} not found")

@router.get("/stops")
async def get_nearby_stops(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON), radius: float = 1.0):
    """Get transit stops within a radius (in km)"""
    if "data" not in transit_data_cache:
        generate_synthetic_transit_data(lat, lon)
    
    nearby_stops = []
    for route in transit_data_cache["data"]["routes"]:
        for stop in route["stops"]:
            stop_lat = stop["location"]["lat"]
            stop_lon = stop["location"]["lon"]
            
            distance = haversine_distance(lat, lon, stop_lat, stop_lon)
            if distance <= radius:
                stop_data = {**stop, "distance": round(distance, 2), "route": {
                    "id": route["id"],
                    "name": route["name"],
                    "type": route["type"],
                    "color": route["color"]
                }}
                nearby_stops.append(stop_data)
    
    return {
        "count": len(nearby_stops),
        "radius_km": radius,
        "center": {"lat": lat, "lon": lon},
        "stops": sorted(nearby_stops, key=lambda x: x["distance"])
    }