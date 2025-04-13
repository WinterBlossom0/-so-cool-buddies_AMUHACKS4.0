from fastapi import APIRouter, HTTPException
import os
import httpx
import random
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
import json
from sklearn.linear_model import LinearRegression

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/traffic",
    tags=["traffic"],
    responses={404: {"description": "Not found"}},
)

# In-memory storage for traffic data
traffic_data_cache = {
    "last_updated": None,
    "roads": [],
    "junctions": [],
    "incidents": []
}

# ML model for traffic prediction
traffic_prediction_model = None

class TrafficPredictor:
    """Simple ML model to predict traffic congestion"""
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False
        self.train_basic_model()
    
    def train_basic_model(self):
        """Train a basic model with synthetic data"""
        # Features: [hour_of_day, day_of_week, is_holiday, road_capacity, baseline_traffic]
        X = []
        y = []  # Target: congestion_score (0-100)
        
        # Generate synthetic training data
        for _ in range(500):
            hour = random.randint(0, 23)
            day = random.randint(0, 6)  # 0=Monday, 6=Sunday
            is_holiday = random.choice([0, 1])
            road_capacity = random.randint(1, 5)  # 1=small road, 5=highway
            baseline_traffic = random.randint(10, 90)
            
            # Feature vector
            X.append([hour, day, is_holiday, road_capacity, baseline_traffic])
            
            # Target - more congestion during rush hours on weekdays
            base_congestion = baseline_traffic
            
            # Rush hour effect (7-9am, 4-6pm on weekdays)
            rush_hour_effect = 0
            if day < 5:  # Weekdays
                if 7 <= hour <= 9 or 16 <= hour <= 18:
                    rush_hour_effect = random.randint(10, 30)
            
            # Weekend effect
            weekend_effect = -10 if day >= 5 else 0
            
            # Holiday effect
            holiday_effect = -15 if is_holiday == 1 else 0
            
            # Capacity effect
            capacity_effect = -5 * road_capacity
            
            # Calculate final congestion with some randomness
            congestion = min(100, max(0, base_congestion + rush_hour_effect + weekend_effect + 
                                      holiday_effect + capacity_effect + random.randint(-10, 10)))
            
            y.append(congestion)
        
        # Train model
        self.model.fit(X, y)
        self.is_trained = True
    
    def predict_congestion(self, features):
        """Predict traffic congestion based on features"""
        if not self.is_trained:
            self.train_basic_model()
            
        prediction = self.model.predict([features])[0]
        return max(0, min(100, prediction))  # Clamp between 0-100

# Initialize the traffic predictor
traffic_predictor = TrafficPredictor()

def get_day_phase():
    """Get the current phase of the day"""
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"

def generate_traffic_data(lat=None, lon=None, refresh=False):
    """Generate synthetic traffic data with predictive modeling"""
    # If we have cached data and it's less than 5 minutes old, return it
    if not refresh and traffic_data_cache["last_updated"] and \
       (datetime.now() - traffic_data_cache["last_updated"]).total_seconds() < 300:
        return traffic_data_cache
        
    current_date = datetime.now()
    hour_of_day = current_date.hour
    day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday
    is_holiday = 1 if day_of_week >= 5 else 0  # Simple holiday detection (weekends)
    day_phase = get_day_phase()
    
    # Road segments with traffic data
    roads = []
    road_names = [
        "Main Street", "Oak Avenue", "Park Road", "Broadway", "Highland Avenue",
        "Riverside Drive", "Central Parkway", "Market Street", "University Boulevard", 
        "Industrial Way", "Harbor Road", "Commerce Street"
    ]
    
    for i, name in enumerate(road_names):
        # Create a road with varying capacity
        road_capacity = random.randint(1, 5)  # 1=small road, 5=highway
        baseline_traffic = random.randint(20, 80)
        
        # Predict congestion using ML model
        features = [hour_of_day, day_of_week, is_holiday, road_capacity, baseline_traffic]
        congestion_score = traffic_predictor.predict_congestion(features)
        
        # Calculate average speed based on congestion and road type
        base_speed = 10 + (road_capacity * 15)  # km/h - bigger roads have higher base speed
        actual_speed = max(5, base_speed * (1 - (congestion_score / 100) * 0.8))
        
        # Generate some coordinates for the road segment
        if lat and lon:
            start_lat = float(lat) + random.uniform(-0.02, 0.02)
            start_lon = float(lon) + random.uniform(-0.02, 0.02)
            end_lat = start_lat + random.uniform(-0.01, 0.01)
            end_lon = start_lon + random.uniform(-0.01, 0.01)
        else:
            start_lat = 51.5074 + random.uniform(-0.02, 0.02)
            start_lon = -0.1278 + random.uniform(-0.02, 0.02)
            end_lat = start_lat + random.uniform(-0.01, 0.01)
            end_lon = start_lon + random.uniform(-0.01, 0.01)
            
        # Create road segment data
        road = {
            "id": f"road-{i+1}",
            "name": name,
            "capacity": road_capacity,
            "congestion_score": round(congestion_score, 1),
            "congestion_level": get_congestion_level(congestion_score),
            "average_speed": round(actual_speed, 1),
            "travel_time_mins": round(random.uniform(2, 20), 1),
            "coordinates": {
                "start": {"lat": start_lat, "lon": start_lon},
                "end": {"lat": end_lat, "lon": end_lon}
            },
            "history": generate_road_history(baseline_traffic, road_capacity),
            "prediction": generate_road_prediction(baseline_traffic, road_capacity, day_of_week)
        }
        roads.append(road)
    
    # Generate traffic junctions (intersections)
    junctions = []
    for i in range(8):
        if lat and lon:
            junction_lat = float(lat) + random.uniform(-0.015, 0.015)
            junction_lon = float(lon) + random.uniform(-0.015, 0.015)
        else:
            junction_lat = 51.5074 + random.uniform(-0.015, 0.015)
            junction_lon = -0.1278 + random.uniform(-0.015, 0.015)
            
        # Connect to multiple roads
        connected_road_ids = random.sample([r["id"] for r in roads], k=min(random.randint(2, 4), len(roads)))
        
        # Predict congestion for the junction
        junction_capacity = random.randint(1, 5)
        junction_baseline = random.randint(30, 90)  # Junctions tend to be more congested
        features = [hour_of_day, day_of_week, is_holiday, junction_capacity, junction_baseline]
        congestion_score = traffic_predictor.predict_congestion(features)
        
        junction = {
            "id": f"junction-{i+1}",
            "name": f"Junction {i+1}",
            "type": random.choice(["traffic_light", "roundabout", "uncontrolled"]),
            "coordinates": {"lat": junction_lat, "lon": junction_lon},
            "connected_roads": connected_road_ids,
            "congestion_score": round(congestion_score, 1),
            "congestion_level": get_congestion_level(congestion_score),
            "average_wait_time_sec": int(congestion_score * 1.2)
        }
        junctions.append(junction)
    
    # Generate traffic incidents
    incidents = []
    incident_types = [
        {"type": "accident", "severity": "high", "delay_mins": random.randint(20, 60)},
        {"type": "construction", "severity": "medium", "delay_mins": random.randint(10, 30)},
        {"type": "event", "severity": "low", "delay_mins": random.randint(5, 15)},
        {"type": "road_closure", "severity": "high", "delay_mins": random.randint(30, 90)},
        {"type": "disabled_vehicle", "severity": "medium", "delay_mins": random.randint(10, 25)}
    ]
    
    # Have 0-3 active incidents
    for i in range(random.randint(0, 3)):
        incident = random.choice(incident_types).copy()
        
        # Assign to a random road
        road = random.choice(roads)
        
        # Create coordinates near the road
        incident_lat = (road["coordinates"]["start"]["lat"] + road["coordinates"]["end"]["lat"]) / 2
        incident_lon = (road["coordinates"]["start"]["lon"] + road["coordinates"]["end"]["lon"]) / 2
        # Add a tiny offset
        incident_lat += random.uniform(-0.002, 0.002)
        incident_lon += random.uniform(-0.002, 0.002)
        
        # Duration
        start_time = datetime.now() - timedelta(minutes=random.randint(0, 60))
        end_time = start_time + timedelta(minutes=random.randint(30, 180))
        
        incident.update({
            "id": f"incident-{i+1}",
            "road_id": road["id"],
            "road_name": road["name"],
            "description": get_incident_description(incident["type"]),
            "coordinates": {"lat": incident_lat, "lon": incident_lon},
            "start_time": start_time.isoformat(),
            "estimated_end_time": end_time.isoformat(),
            "status": "active"
        })
        incidents.append(incident)
    
    # Update cache
    traffic_data_cache.update({
        "last_updated": datetime.now(),
        "roads": roads,
        "junctions": junctions,
        "incidents": incidents,
        "stats": {
            "average_congestion": round(sum(r["congestion_score"] for r in roads) / len(roads), 1),
            "high_congestion_areas": len([r for r in roads if r["congestion_score"] > 70]),
            "total_incidents": len(incidents),
            "day_phase": day_phase
        }
    })
    
    return traffic_data_cache

def get_congestion_level(score):
    """Get string representation of congestion level"""
    if score < 30:
        return {"level": "low", "color": "green"}
    elif score < 60:
        return {"level": "moderate", "color": "yellow"}
    elif score < 80:
        return {"level": "high", "color": "orange"}
    else:
        return {"level": "severe", "color": "red"}

def get_incident_description(incident_type):
    """Generate a description for an incident based on type"""
    descriptions = {
        "accident": [
            "Multi-vehicle collision causing delays",
            "Traffic accident with emergency responders on scene",
            "Minor collision, right lane blocked"
        ],
        "construction": [
            "Road maintenance work in progress",
            "Lane closures due to utility repairs",
            "Construction zone, reduced speed limit"
        ],
        "event": [
            "Sports event causing increased traffic",
            "Public gathering affecting traffic flow",
            "Street fair closing multiple lanes"
        ],
        "road_closure": [
            "Full road closure due to gas leak",
            "Bridge closed for emergency repairs",
            "Road closed due to flooding"
        ],
        "disabled_vehicle": [
            "Stalled vehicle in right lane",
            "Disabled truck on shoulder",
            "Vehicle with flat tire blocking lane"
        ]
    }
    
    if incident_type in descriptions:
        return random.choice(descriptions[incident_type])
    return "Traffic incident reported"

def generate_road_history(baseline, capacity):
    """Generate historical traffic data for a road segment"""
    now = datetime.now()
    history = []
    
    # Generate data for past 24 hours in 1-hour intervals
    for i in range(24):
        timestamp = now - timedelta(hours=24-i)
        hour = timestamp.hour
        is_rush_hour = (7 <= hour <= 9) or (16 <= hour <= 18)
        is_weekend = timestamp.weekday() >= 5
        
        # Adjust congestion based on time factors
        base_congestion = baseline
        
        if is_weekend:
            base_congestion -= 20
        
        if is_rush_hour and not is_weekend:
            base_congestion += random.randint(15, 35)
        
        # Capacity effect
        capacity_effect = -5 * capacity
        
        # Add randomness
        congestion = min(100, max(0, base_congestion + capacity_effect + random.randint(-10, 10)))
        
        history.append({
            "timestamp": timestamp.isoformat(),
            "congestion_score": round(congestion, 1),
            "congestion_level": get_congestion_level(congestion)
        })
    
    return history

def generate_road_prediction(baseline, capacity, weekday):
    """Generate traffic predictions for the next 12 hours"""
    now = datetime.now()
    predictions = []
    
    # Generate predictions for next 12 hours in 1-hour intervals
    for i in range(1, 13):
        future_time = now + timedelta(hours=i)
        hour = future_time.hour
        future_weekday = (weekday + (1 if future_time.day != now.day else 0)) % 7
        is_rush_hour = (7 <= hour <= 9) or (16 <= hour <= 18)
        is_weekend = future_weekday >= 5
        
        # Features for prediction
        features = [
            hour,
            future_weekday,
            1 if is_weekend else 0,
            capacity,
            baseline
        ]
        
        # Use ML model for prediction
        congestion = traffic_predictor.predict_congestion(features)
        
        predictions.append({
            "timestamp": future_time.isoformat(),
            "congestion_score": round(congestion, 1),
            "congestion_level": get_congestion_level(congestion)
        })
    
    return predictions

@router.get("/status")
async def get_traffic_status(lat: Optional[float] = None, lon: Optional[float] = None, refresh: bool = False):
    """Get current traffic status for the city or a specific area"""
    return generate_traffic_data(lat, lon, refresh)

@router.get("/roads")
async def get_roads(lat: Optional[float] = None, lon: Optional[float] = None):
    """Get traffic data for road segments"""
    data = generate_traffic_data(lat, lon)
    return {"roads": data["roads"]}

@router.get("/roads/{road_id}")
async def get_road_details(road_id: str):
    """Get detailed traffic information for a specific road segment"""
    data = generate_traffic_data()
    for road in data["roads"]:
        if road["id"] == road_id:
            return road
    raise HTTPException(status_code=404, detail=f"Road segment {road_id} not found")

@router.get("/junctions")
async def get_junctions(lat: Optional[float] = None, lon: Optional[float] = None):
    """Get traffic data for junctions/intersections"""
    data = generate_traffic_data(lat, lon)
    return {"junctions": data["junctions"]}

@router.get("/incidents")
async def get_incidents(lat: Optional[float] = None, lon: Optional[float] = None):
    """Get traffic incidents in the area"""
    data = generate_traffic_data(lat, lon)
    return {"incidents": data["incidents"]}

@router.get("/prediction")
async def get_traffic_prediction(hours_ahead: int = 2):
    """Get traffic prediction for the specified hours ahead"""
    if hours_ahead < 1 or hours_ahead > 12:
        raise HTTPException(status_code=400, detail="Hours ahead must be between 1 and 12")
    
    data = generate_traffic_data()
    predictions = []
    
    for road in data["roads"]:
        if hours_ahead <= len(road["prediction"]):
            prediction = road["prediction"][hours_ahead - 1]
            predictions.append({
                "road_id": road["id"],
                "road_name": road["name"],
                "timestamp": prediction["timestamp"],
                "congestion_score": prediction["congestion_score"],
                "congestion_level": prediction["congestion_level"]
            })
    
    return {
        "timestamp": (datetime.now() + timedelta(hours=hours_ahead)).isoformat(),
        "hours_ahead": hours_ahead,
        "predictions": predictions
    }