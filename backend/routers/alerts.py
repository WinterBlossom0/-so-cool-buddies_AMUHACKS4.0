from fastapi import APIRouter, HTTPException
import os
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/alerts",
    tags=["alerts"],
    responses={404: {"description": "Not found"}},
)

# In-memory storage for alerts
alert_database = {
    "alerts": [],
    "severity_levels": [
        {"id": "info", "name": "Information", "color": "blue"},
        {"id": "advisory", "name": "Advisory", "color": "yellow"},
        {"id": "warning", "name": "Warning", "color": "orange"},
        {"id": "emergency", "name": "Emergency", "color": "red"}
    ],
    "categories": [
        {"id": "weather", "name": "Weather", "icon": "cloud"},
        {"id": "traffic", "name": "Traffic", "icon": "car"},
        {"id": "environment", "name": "Environment", "icon": "tree"},
        {"id": "safety", "name": "Public Safety", "icon": "shield"},
        {"id": "infrastructure", "name": "Infrastructure", "icon": "building"},
        {"id": "health", "name": "Public Health", "icon": "medkit"},
        {"id": "events", "name": "Events", "icon": "calendar"}
    ]
}

def generate_synthetic_alerts():
    """Generate synthetic alerts if database is empty"""
    if len(alert_database["alerts"]) > 0:
        return
        
    severity_levels = alert_database["severity_levels"]
    categories = alert_database["categories"]
    
    # Sample alert templates
    alert_templates = [
        # Weather alerts
        {
            "category": "weather",
            "titles": [
                "Heavy Rain Expected",
                "High Wind Warning",
                "Heat Advisory",
                "Flash Flood Warning",
                "Thunderstorm Alert"
            ],
            "descriptions": [
                "Heavy rainfall expected over the next 24 hours. Possible localized flooding in low-lying areas.",
                "Wind gusts up to 60 mph expected. Secure loose outdoor objects and use caution when driving.",
                "Temperatures expected to reach 95°F. Stay hydrated and limit outdoor activities.",
                "Potential for flash flooding in the area due to heavy rainfall. Avoid flood-prone areas and driving through standing water.",
                "Severe thunderstorms expected with potential for lightning and hail."
            ],
            "severity_weights": [0.3, 0.4, 0.2, 0.1]  # info, advisory, warning, emergency
        },
        # Traffic alerts
        {
            "category": "traffic",
            "titles": [
                "Major Road Closure",
                "Traffic Accident",
                "Highway Construction",
                "Public Transit Disruption",
                "Special Event Traffic"
            ],
            "descriptions": [
                "Main Street closed between 5th and 10th Avenues due to water main repair. Expected to reopen at 6 PM.",
                "Multi-vehicle accident on Highway 101 northbound. Expect delays of up to 30 minutes.",
                "Lane closures on Central Bridge for maintenance work. Allow extra travel time.",
                "Bus routes 10, 15, and 22 are re-routed due to street festival. Check transit app for details.",
                "Heavy traffic expected around downtown due to concert at City Arena. Consider alternate routes."
            ],
            "severity_weights": [0.4, 0.3, 0.2, 0.1]  # info, advisory, warning, emergency
        },
        # Environment alerts
        {
            "category": "environment",
            "titles": [
                "Air Quality Alert",
                "Water Conservation Request",
                "Harmful Algae Bloom",
                "Pollen Count Warning",
                "Recycling Program Change"
            ],
            "descriptions": [
                "Air quality index has reached unhealthy levels. Sensitive groups should limit outdoor exposure.",
                "Voluntary water conservation requested due to drought conditions. Please limit non-essential water usage.",
                "Harmful algae bloom detected at City Lake. Avoid water contact and keep pets away.",
                "Pollen counts are extremely high today. Those with allergies should take precautions.",
                "Changes to city recycling program effective next week. See city website for details."
            ],
            "severity_weights": [0.2, 0.4, 0.3, 0.1]  # info, advisory, warning, emergency
        },
        # Safety alerts
        {
            "category": "safety",
            "titles": [
                "Missing Person Alert",
                "Suspicious Activity Report",
                "Evacuation Order",
                "Gas Leak Warning",
                "Power Outage Alert"
            ],
            "descriptions": [
                "Police seeking public assistance in locating missing 10-year-old child. Last seen wearing red jacket and blue jeans.",
                "Reports of suspicious activity in the downtown area. Police have increased patrols.",
                "Mandatory evacuation order for Riverside neighborhood due to rising flood waters.",
                "Gas leak reported near Main and 5th streets. Area closed to traffic. Avoid the area.",
                "Power outage affecting north side of city. Utility crews working to restore service."
            ],
            "severity_weights": [0.1, 0.2, 0.3, 0.4]  # info, advisory, warning, emergency
        }
    ]
    
    # Create synthetic alerts
    alerts = []
    now = datetime.now()
    
    # Create a mix of active and expired alerts
    for i in range(20):
        # Select random template
        template = random.choice(alert_templates)
        category_id = template["category"]
        
        # Select random title and matching description
        title_idx = random.randint(0, len(template["titles"]) - 1)
        title = template["titles"][title_idx]
        description = template["descriptions"][title_idx]
        
        # Select severity with template-specific weights
        severity = random.choices(
            severity_levels,
            weights=template["severity_weights"]
        )[0]
        
        # Determine if alert is active or expired
        is_active = random.random() < 0.7  # 70% chance of being active
        
        # Create timestamps
        if is_active:
            # Active alerts
            created_at = now - timedelta(hours=random.randint(1, 24))
            expires_at = now + timedelta(hours=random.randint(1, 48))
        else:
            # Expired alerts
            created_at = now - timedelta(days=random.randint(2, 10))
            expires_at = now - timedelta(hours=random.randint(1, 24))
        
        # Create the alert
        alert = {
            "id": f"alert-{i+1}",
            "title": title,
            "description": description,
            "category_id": category_id,
            "severity_id": severity["id"],
            "created_at": created_at.isoformat(),
            "expires_at": expires_at.isoformat(),
            "is_active": is_active,
            "affected_areas": ["Downtown", "North Side", "Waterfront"][random.randint(0, 2)],
            "source": ["City Emergency Management", "Police Department", "Weather Service", "Department of Transportation"][random.randint(0, 3)],
            "action_required": random.choice([
                "No action required. For informational purposes only.",
                "Be prepared and stay informed.",
                "Take precautions and follow official guidance.",
                "Take immediate action as directed."
            ])
        }
        
        alerts.append(alert)
    
    alert_database["alerts"] = alerts

@router.get("/")
async def get_alerts(category_id: str = None, severity_id: str = None, active_only: bool = True):
    """Get alerts, optionally filtered by category, severity, or active status"""
    # Generate sample data if empty
    if len(alert_database["alerts"]) == 0:
        generate_synthetic_alerts()
    
    alerts = alert_database["alerts"]
    
    # Apply filters
    if category_id:
        alerts = [a for a in alerts if a["category_id"] == category_id]
    if severity_id:
        alerts = [a for a in alerts if a["severity_id"] == severity_id]
    if active_only:
        current_time = datetime.now().isoformat()
        alerts = [a for a in alerts if a["is_active"] and a["expires_at"] > current_time]
    
    # Sort by severity (emergency first) then by creation date (newest first)
    severity_order = {
        "emergency": 0,
        "warning": 1,
        "advisory": 2,
        "info": 3
    }
    
    alerts = sorted(alerts, key=lambda x: (severity_order.get(x["severity_id"], 999), x["created_at"]), reverse=True)
    
    return {
        "count": len(alerts),
        "alerts": alerts
    }

@router.get("/categories")
async def get_alert_categories():
    """Get all available alert categories"""
    return {"categories": alert_database["categories"]}

@router.get("/severity-levels")
async def get_severity_levels():
    """Get all available severity levels"""
    return {"severity_levels": alert_database["severity_levels"]}

@router.get("/{alert_id}")
async def get_alert(alert_id: str):
    """Get a specific alert by ID"""
    # Generate sample data if empty
    if len(alert_database["alerts"]) == 0:
        generate_synthetic_alerts()
    
    for alert in alert_database["alerts"]:
        if alert["id"] == alert_id:
            return alert
    
    raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

@router.get("/summary/active")
async def get_active_alerts_summary():
    """Get a summary of currently active alerts by category and severity"""
    # Generate sample data if empty
    if len(alert_database["alerts"]) == 0:
        generate_synthetic_alerts()
    
    current_time = datetime.now().isoformat()
    active_alerts = [a for a in alert_database["alerts"] if a["is_active"] and a["expires_at"] > current_time]
    
    # Count by category
    category_counts = {}
    for alert in active_alerts:
        cat_id = alert["category_id"]
        if cat_id not in category_counts:
            category_counts[cat_id] = 0
        category_counts[cat_id] += 1
    
    # Count by severity
    severity_counts = {}
    for alert in active_alerts:
        sev_id = alert["severity_id"]
        if sev_id not in severity_counts:
            severity_counts[sev_id] = 0
        severity_counts[sev_id] += 1
    
    # Get highest severity alert
    highest_severity_alert = None
    severity_order = ["info", "advisory", "warning", "emergency"]
    
    for severity in reversed(severity_order):  # Check from highest to lowest
        matching_alerts = [a for a in active_alerts if a["severity_id"] == severity]
        if matching_alerts:
            highest_severity_alert = matching_alerts[0]
            break
    
    return {
        "total_active": len(active_alerts),
        "category_counts": category_counts,
        "severity_counts": severity_counts,
        "highest_severity_alert": highest_severity_alert
    }