from fastapi import APIRouter, HTTPException
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/waste",
    tags=["waste"],
    responses={404: {"description": "Not found"}},
)

DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074")
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")

# Memory storage for simulated data
waste_bins = {}

def get_bin_status(fill_percentage):
    """Return status based on fill percentage"""
    if fill_percentage < 25:
        return {"status": "low", "color": "green"}
    elif fill_percentage < 75:
        return {"status": "moderate", "color": "yellow"}
    else:
        return {"status": "high", "color": "red"}

def generate_waste_bins(lat=DEFAULT_LAT, lon=DEFAULT_LON):
    """Generate synthetic waste bin data"""
    bin_types = ["general", "recycling", "organic", "paper", "glass"]
    bin_locations = [
        {"name": "City Park", "offset": (0.005, 0.007)},
        {"name": "Main Street", "offset": (0.002, -0.004)},
        {"name": "Shopping Center", "offset": (-0.006, 0.003)},
        {"name": "Residential Area", "offset": (-0.003, -0.008)},
        {"name": "Civic Center", "offset": (0.001, 0.001)},
        {"name": "Riverside Walk", "offset": (0.008, -0.002)}
    ]
    
    bins = []
    bin_id = 1
    
    for location in bin_locations:
        # Generate bins for each location
        location_bins = []
        for bin_type in bin_types:
            # Randomly skip some bin types at some locations
            if random.random() < 0.2:  # 20% chance to skip
                continue
                
            bin_lat = float(lat) + location["offset"][0]
            bin_lon = float(lon) + location["offset"][1]
            
            # Generate random fill level based on bin type
            if bin_type == "general":
                fill_percentage = random.randint(50, 90)  # General waste tends to fill faster
            elif bin_type in ["recycling", "paper"]:
                fill_percentage = random.randint(30, 80)
            else:
                fill_percentage = random.randint(20, 70)
                
            # Calculate collection frequency
            if fill_percentage > 75:
                next_collection = (datetime.now() + timedelta(days=random.randint(0, 1))).isoformat()
            else:
                next_collection = (datetime.now() + timedelta(days=random.randint(2, 5))).isoformat()
                
            # Generate history (last 7 days)
            history = []
            for i in range(7):
                past_date = (datetime.now() - timedelta(days=i)).isoformat()
                # Fill level decreases as we go back in time
                past_fill = max(0, fill_percentage - (i * random.randint(10, 20)))
                history.append({
                    "timestamp": past_date,
                    "fill_percentage": past_fill
                })
            
            status_info = get_bin_status(fill_percentage)
            
            bin_data = {
                "id": f"bin-{bin_id}",
                "type": bin_type,
                "location": {
                    "name": f"{location['name']}",
                    "lat": bin_lat,
                    "lon": bin_lon
                },
                "capacity": random.choice([100, 200, 300, 500]),  # Liters
                "fill_percentage": fill_percentage,
                "status": status_info["status"],
                "color": status_info["color"],
                "last_updated": datetime.now().isoformat(),
                "next_collection": next_collection,
                "history": history
            }
            
            location_bins.append(bin_data)
            bin_id += 1
            
        bins.extend(location_bins)
    
    # Cache the generated bins for later use
    waste_bins["data"] = {
        "count": len(bins),
        "bins": bins,
        "generated": datetime.now().isoformat()
    }
    
    return waste_bins["data"]

@router.get("/")
async def get_waste_bins(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON), refresh: bool = False):
    """Get all waste bins in the vicinity"""
    # If refresh is True or no data exists, regenerate
    if refresh or "data" not in waste_bins:
        return generate_waste_bins(lat, lon)
    
    # Otherwise update fill levels randomly to simulate real-time changes
    for bin in waste_bins["data"]["bins"]:
        # 30% chance to change fill level
        if random.random() < 0.3:
            # Adjust fill level by -5% to +15%
            change = random.uniform(-5, 15)
            bin["fill_percentage"] = max(0, min(100, bin["fill_percentage"] + change))
            
            # Update status
            status_info = get_bin_status(bin["fill_percentage"])
            bin["status"] = status_info["status"]
            bin["color"] = status_info["color"]
            bin["last_updated"] = datetime.now().isoformat()
    
    return waste_bins["data"]

@router.get("/{bin_id}")
async def get_bin_details(bin_id: str):
    """Get detailed information about a specific waste bin"""
    # Ensure data exists
    if "data" not in waste_bins:
        generate_waste_bins()
    
    # Find the bin with the matching ID
    for bin in waste_bins["data"]["bins"]:
        if bin["id"] == bin_id:
            return bin
    
    # If not found, throw a 404
    raise HTTPException(status_code=404, detail=f"Waste bin {bin_id} not found")