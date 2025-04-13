from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

router = APIRouter(
    prefix="/api/alerts",
    tags=["alerts"],
    responses={404: {"description": "Not found"}},
)

# Models
class Location(BaseModel):
    lat: float
    lon: float
    radius: float = 5.0
    address: Optional[str] = None

class AlertCategory(BaseModel):
    id: str
    name: str
    icon: str

class SeverityLevel(BaseModel):
    id: str
    name: str
    color: str

class CityAlert(BaseModel):
    id: str
    title: str
    description: str
    created_at: str
    expires_at: str
    category_id: str
    severity_id: str
    location: Location
    is_active: bool

class AlertsData(BaseModel):
    alerts: List[CityAlert]
    categories: List[AlertCategory]
    severity_levels: List[SeverityLevel]

class SubscriptionRequest(BaseModel):
    category_ids: List[str]
    severity_ids: List[str]
    location_enabled: bool = False
    location: Optional[Location] = None

# Sample data - in a real app this would come from a database
CATEGORIES = [
    AlertCategory(id="weather", name="Weather", icon="cloud"),
    AlertCategory(id="traffic", name="Traffic", icon="directions_car"),
    AlertCategory(id="safety", name="Public Safety", icon="security"),
    AlertCategory(id="environment", name="Environment", icon="nature"),
    AlertCategory(id="infrastructure", name="Infrastructure", icon="construction"),
]

SEVERITY_LEVELS = [
    SeverityLevel(id="info", name="Information", color="#3498db"),
    SeverityLevel(id="advisory", name="Advisory", color="#f39c12"),
    SeverityLevel(id="warning", name="Warning", color="#e67e22"),
    SeverityLevel(id="emergency", name="Emergency", color="#e74c3c"),
]

# Sample alerts - in a real app these would be stored in a database
ALERTS = [
    CityAlert(
        id="1",
        title="Flash Flood Warning",
        description="Heavy rainfall expected. Possible flash flooding in low-lying areas.",
        created_at=datetime.now().isoformat(),
        expires_at=(datetime.now() + timedelta(days=1)).isoformat(),
        category_id="weather",
        severity_id="warning",
        location=Location(lat=51.5074, lon=-0.1278, radius=10.0, address="Central London"),
        is_active=True,
    ),
    CityAlert(
        id="2",
        title="Road Closure",
        description="Main Street closed for construction between 1st and 3rd Avenue.",
        created_at=datetime.now().isoformat(),
        expires_at=(datetime.now() + timedelta(days=3)).isoformat(),
        category_id="traffic",
        severity_id="advisory",
        location=Location(lat=51.5074, lon=-0.1278, radius=2.0, address="Main Street"),
        is_active=True,
    ),
    CityAlert(
        id="3",
        title="Air Quality Advisory",
        description="Elevated levels of air pollution. Sensitive groups should reduce outdoor activities.",
        created_at=datetime.now().isoformat(),
        expires_at=(datetime.now() + timedelta(hours=12)).isoformat(),
        category_id="environment",
        severity_id="advisory",
        location=Location(lat=51.5074, lon=-0.1278, radius=20.0, address="Greater London"),
        is_active=True,
    ),
]

# In-memory subscriptions database
USER_SUBSCRIPTIONS = {}

@router.get("/", response_model=AlertsData)
async def get_alerts(
    category_id: Optional[List[str]] = Query(None),
    severity_id: Optional[List[str]] = Query(None),
    active: bool = True
):
    """Get all city alerts with optional filtering"""
    filtered_alerts = ALERTS
    
    if category_id:
        filtered_alerts = [a for a in filtered_alerts if a.category_id in category_id]
    
    if severity_id:
        filtered_alerts = [a for a in filtered_alerts if a.severity_id in severity_id]
    
    if active:
        filtered_alerts = [a for a in filtered_alerts if a.is_active]
    
    return AlertsData(
        alerts=filtered_alerts,
        categories=CATEGORIES,
        severity_levels=SEVERITY_LEVELS
    )

@router.get("/{alert_id}", response_model=CityAlert)
async def get_alert(alert_id: str):
    """Get a specific alert by ID"""
    for alert in ALERTS:
        if alert.id == alert_id:
            return alert
    
    raise HTTPException(status_code=404, detail="Alert not found")

@router.get("/nearby", response_model=dict)
async def get_alerts_nearby(
    lat: float,
    lon: float,
    radius: float = 5.0,
    category_id: Optional[List[str]] = Query(None),
    severity_id: Optional[List[str]] = Query(None),
):
    """Get alerts within a specified radius of coordinates"""
    # In a real app, this would use geospatial queries
    filtered_alerts = ALERTS
    
    if category_id:
        filtered_alerts = [a for a in filtered_alerts if a.category_id in category_id]
    
    if severity_id:
        filtered_alerts = [a for a in filtered_alerts if a.severity_id in severity_id]
    
    # For demo purposes, just return alerts that might be nearby based on radius
    nearby_alerts = []
    for alert in filtered_alerts:
        # In a real app, use proper geospatial calculations
        # This is just a simple approximation based on the alert's own radius + requested radius
        if alert.location.radius + radius >= 10:  # Pretend all alerts are within range if radius is large enough
            nearby_alerts.append(alert)
    
    return {
        "alerts": nearby_alerts,
        "location": {"lat": lat, "lon": lon, "radius": radius}
    }

@router.post("/subscribe/{user_id}")
async def subscribe_to_alerts(user_id: str, subscription: SubscriptionRequest):
    """Subscribe to alerts for specific categories and severity levels"""
    # In a real app, this would save to a database
    USER_SUBSCRIPTIONS[user_id] = {
        "category_ids": subscription.category_ids,
        "severity_ids": subscription.severity_ids,
        "location_enabled": subscription.location_enabled,
        "location": subscription.location.dict() if subscription.location else None,
        "created_at": datetime.now().isoformat()
    }
    
    return {"status": "success", "message": "Subscription saved successfully"}

@router.post("/unsubscribe/{user_id}")
async def unsubscribe_from_alerts(user_id: str, subscription: Optional[SubscriptionRequest] = None):
    """Unsubscribe from alerts"""
    if user_id not in USER_SUBSCRIPTIONS:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription is None:
        # Unsubscribe from all
        del USER_SUBSCRIPTIONS[user_id]
        return {"status": "success", "message": "Unsubscribed from all alerts"}
    
    # Otherwise update subscription by removing specified categories/severities
    current = USER_SUBSCRIPTIONS[user_id]
    
    if subscription.category_ids:
        current["category_ids"] = [c for c in current["category_ids"] if c not in subscription.category_ids]
    
    if subscription.severity_ids:
        current["severity_ids"] = [s for s in current["severity_ids"] if s not in subscription.severity_ids]
    
    # If no categories or severities left, remove the subscription
    if not current["category_ids"] and not current["severity_ids"]:
        del USER_SUBSCRIPTIONS[user_id]
        return {"status": "success", "message": "No subscriptions left, removed completely"}
    
    return {"status": "success", "message": "Subscription updated"}