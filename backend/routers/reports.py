from fastapi import APIRouter, HTTPException, Body
import os
from dotenv import load_dotenv
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"],
    responses={404: {"description": "Not found"}},
)

DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074")
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")

# In-memory storage for reports (would use Firebase Firestore in production)
report_database = {
    "reports": [],
    "categories": [
        {"id": "infrastructure", "name": "Infrastructure", "icon": "road"},
        {"id": "environment", "name": "Environment", "icon": "tree"},
        {"id": "safety", "name": "Safety", "icon": "shield"},
        {"id": "waste", "name": "Waste & Cleanliness", "icon": "trash"},
        {"id": "lighting", "name": "Street Lighting", "icon": "lightbulb"},
        {"id": "noise", "name": "Noise", "icon": "volume-high"},
        {"id": "other", "name": "Other Issues", "icon": "question"}
    ],
    "statuses": [
        {"id": "submitted", "name": "Submitted", "color": "blue"},
        {"id": "under_review", "name": "Under Review", "color": "orange"},
        {"id": "in_progress", "name": "In Progress", "color": "yellow"},
        {"id": "resolved", "name": "Resolved", "color": "green"},
        {"id": "rejected", "name": "Rejected", "color": "red"}
    ]
}

class ReportCreate(BaseModel):
    title: str
    description: str
    category_id: str
    location: dict = Field(..., example={"lat": 51.5074, "lon": -0.1278, "address": "10 Downing Street"})
    user_id: Optional[str] = None
    priority: int = Field(1, ge=1, le=5)
    photos: List[str] = []

class ReportStatusUpdate(BaseModel):
    status_id: str
    comment: Optional[str] = None

def generate_synthetic_reports(lat=DEFAULT_LAT, lon=DEFAULT_LON, count=15):
    """Generate synthetic reports if database is empty"""
    if len(report_database["reports"]) > 0:
        return
        
    lat, lon = float(lat), float(lon)
    categories = report_database["categories"]
    statuses = report_database["statuses"]
    
    # Sample report titles and descriptions
    report_templates = [
        {
            "category": "infrastructure",
            "titles": ["Pothole on Main Street", "Damaged Sidewalk", "Broken Traffic Light", "Road Sign Missing"],
            "descriptions": ["Large pothole causing traffic issues", "Sidewalk is cracked and dangerous for pedestrians", 
                           "Traffic light at intersection is not working", "Road sign has been knocked down"]
        },
        {
            "category": "environment",
            "titles": ["Fallen Tree", "Overgrown Vegetation", "Water Leak", "Air Pollution"],
            "descriptions": ["Tree has fallen across pathway", "Vegetation blocking pedestrian access", 
                           "Water leaking from underground pipe", "Strong smell of gas in the area"]
        },
        {
            "category": "safety",
            "titles": ["Street Light Out", "Dangerous Crossing", "Abandoned Vehicle", "Missing Manhole Cover"],
            "descriptions": ["Street light not working creating unsafe conditions", "Pedestrian crossing is unsafe due to poor visibility", 
                           "Vehicle abandoned for several weeks", "Dangerous missing manhole cover"]
        },
        {
            "category": "waste",
            "titles": ["Overflowing Bin", "Illegal Dumping", "Graffiti", "Dog Waste Issue"],
            "descriptions": ["Public bin is overflowing", "Someone has dumped furniture on the sidewalk", 
                           "Offensive graffiti on public building", "Recurring dog waste problem in park"]
        }
    ]
    
    # Create synthetic reports
    reports = []
    
    for i in range(count):
        # Select random template
        template = random.choice(report_templates)
        category_id = template["category"]
        title = random.choice(template["titles"])
        description = random.choice(template["descriptions"])
        
        # Create random location near the center
        report_lat = lat + random.uniform(-0.01, 0.01)
        report_lon = lon + random.uniform(-0.01, 0.01)
        
        # Random status with weighting (more likely to be in progress than resolved)
        status_weights = [0.3, 0.3, 0.2, 0.1, 0.1]  # submitted, review, in_progress, resolved, rejected
        status = random.choices(statuses, weights=status_weights)[0]
        
        # Create random dates
        days_ago = random.randint(0, 30)
        created_at = datetime.now() - timedelta(days=days_ago)
        
        # If status is not submitted, add a status history
        status_history = [
            {
                "status_id": "submitted",
                "comment": "Report submitted by citizen",
                "timestamp": created_at.isoformat()
            }
        ]
        
        if status["id"] != "submitted":
            # Add review date
            review_date = created_at + timedelta(days=random.randint(1, 3))
            status_history.append({
                "status_id": "under_review",
                "comment": "Report is being reviewed by city services",
                "timestamp": review_date.isoformat()
            })
            
        if status["id"] in ["in_progress", "resolved", "rejected"]:
            # Add in progress date
            progress_date = created_at + timedelta(days=random.randint(4, 7))
            status_history.append({
                "status_id": "in_progress",
                "comment": "Work has begun to address this issue",
                "timestamp": progress_date.isoformat()
            })
            
        if status["id"] in ["resolved", "rejected"]:
            # Add final status date
            final_date = created_at + timedelta(days=random.randint(8, 14))
            comment = "Issue has been resolved" if status["id"] == "resolved" else "Report rejected: not a city service issue"
            status_history.append({
                "status_id": status["id"],
                "comment": comment,
                "timestamp": final_date.isoformat()
            })
            
        # Random number of votes
        upvotes = random.randint(0, 30)
        
        report = {
            "id": f"report-{i+1}",
            "title": title,
            "description": description,
            "category_id": category_id,
            "status_id": status["id"],
            "priority": random.randint(1, 5),
            "location": {
                "lat": report_lat,
                "lon": report_lon,
                "address": f"{random.randint(1, 100)} Sample Street"
            },
            "user_id": f"user-{random.randint(1, 100)}",
            "created_at": created_at.isoformat(),
            "status_history": status_history,
            "upvotes": upvotes,
            "photos": [],
            "comments": []
        }
        
        # Add random citizen comments
        if random.random() < 0.4:  # 40% chance of having comments
            num_comments = random.randint(1, 3)
            for j in range(num_comments):
                comment_date = created_at + timedelta(days=random.randint(1, min(days_ago, 5)))
                comment = {
                    "id": f"comment-{i}-{j}",
                    "user_id": f"user-{random.randint(1, 100)}",
                    "text": random.choice([
                        "This is a serious issue that needs attention.",
                        "I've noticed this problem too.",
                        "Has anyone from the city looked at this yet?",
                        "This has been a problem for weeks now.",
                        "Thank you for reporting this issue!"
                    ]),
                    "created_at": comment_date.isoformat()
                }
                report["comments"].append(comment)
        
        reports.append(report)
    
    report_database["reports"] = reports

@router.get("/categories")
async def get_report_categories():
    """Get all available report categories"""
    return {"categories": report_database["categories"]}

@router.get("/")
async def get_reports(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON), 
                     category_id: str = None, status_id: str = None, limit: int = 50):
    """Get citizen reports, optionally filtered by category or status"""
    # Generate sample data if empty
    if len(report_database["reports"]) == 0:
        generate_synthetic_reports(lat, lon)
    
    reports = report_database["reports"]
    
    # Apply filters
    if category_id:
        reports = [r for r in reports if r["category_id"] == category_id]
    if status_id:
        reports = [r for r in reports if r["status_id"] == status_id]
    
    # Sort by newest first
    reports = sorted(reports, key=lambda x: x["created_at"], reverse=True)
    
    return {
        "count": len(reports),
        "reports": reports[:limit]
    }

@router.post("/")
async def create_report(report: ReportCreate):
    """Submit a new citizen report"""
    # Generate sample data if empty
    if len(report_database["reports"]) == 0:
        generate_synthetic_reports()
    
    # Validate category exists
    category_ids = [c["id"] for c in report_database["categories"]]
    if report.category_id not in category_ids:
        raise HTTPException(status_code=400, detail="Invalid category ID")
    
    # Create new report
    current_time = datetime.now()
    report_id = f"report-{uuid.uuid4()}"
    
    new_report = {
        "id": report_id,
        "title": report.title,
        "description": report.description,
        "category_id": report.category_id,
        "status_id": "submitted",  # Always starts as submitted
        "priority": report.priority,
        "location": report.location,
        "user_id": report.user_id or "anonymous",
        "created_at": current_time.isoformat(),
        "status_history": [
            {
                "status_id": "submitted",
                "comment": "Report submitted by citizen",
                "timestamp": current_time.isoformat()
            }
        ],
        "upvotes": 0,
        "photos": report.photos,
        "comments": []
    }
    
    report_database["reports"].append(new_report)
    
    return new_report

@router.get("/{report_id}")
async def get_report(report_id: str):
    """Get a specific report by ID"""
    # Generate sample data if empty
    if len(report_database["reports"]) == 0:
        generate_synthetic_reports()
    
    for report in report_database["reports"]:
        if report["id"] == report_id:
            return report
    
    raise HTTPException(status_code=404, detail=f"Report {report_id} not found")

@router.patch("/{report_id}/status")
async def update_report_status(report_id: str, update: ReportStatusUpdate):
    """Update the status of a report (admin only)"""
    # Validate status exists
    status_ids = [s["id"] for s in report_database["statuses"]]
    if update.status_id not in status_ids:
        raise HTTPException(status_code=400, detail="Invalid status ID")
    
    # Find and update report
    for report in report_database["reports"]:
        if report["id"] == report_id:
            report["status_id"] = update.status_id
            
            # Add to status history
            report["status_history"].append({
                "status_id": update.status_id,
                "comment": update.comment or f"Status updated to {update.status_id}",
                "timestamp": datetime.now().isoformat()
            })
            
            return report
    
    raise HTTPException(status_code=404, detail=f"Report {report_id} not found")

@router.post("/{report_id}/upvote")
async def upvote_report(report_id: str):
    """Upvote a report to indicate its importance"""
    for report in report_database["reports"]:
        if report["id"] == report_id:
            report["upvotes"] += 1
            return {"id": report_id, "upvotes": report["upvotes"]}
    
    raise HTTPException(status_code=404, detail=f"Report {report_id} not found")

@router.post("/{report_id}/comments")
async def add_comment(report_id: str, comment: dict = Body(...)):
    """Add a comment to a report"""
    for report in report_database["reports"]:
        if report["id"] == report_id:
            comment_id = f"comment-{uuid.uuid4()}"
            new_comment = {
                "id": comment_id,
                "user_id": comment.get("user_id", "anonymous"),
                "text": comment["text"],
                "created_at": datetime.now().isoformat()
            }
            
            report["comments"].append(new_comment)
            return new_comment
    
    raise HTTPException(status_code=404, detail=f"Report {report_id} not found")