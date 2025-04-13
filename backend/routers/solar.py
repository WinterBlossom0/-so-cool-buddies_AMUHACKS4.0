from fastapi import APIRouter, HTTPException
import os
import httpx
import random
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/solar",
    tags=["solar"],
    responses={404: {"description": "Not found"}},
)

OPENEI_SOLAR_API_KEY = os.getenv("OPENEI_SOLAR_API_KEY")
DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074")
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")

def generate_solar_data(lat=DEFAULT_LAT, lon=DEFAULT_LON):
    """Generate synthetic solar power estimation data"""
    now = datetime.now()
    current_month = now.month
    
    # Adjust for seasonal variations in solar radiation
    # Northern Hemisphere: More sun in summer (June-August), less in winter (December-February)
    if 3 <= current_month <= 5:  # Spring
        base_radiation = 4.5  # kWh/m²/day
        cloud_factor = 0.7
    elif 6 <= current_month <= 8:  # Summer
        base_radiation = 6.0  # kWh/m²/day
        cloud_factor = 0.8
    elif 9 <= current_month <= 11:  # Fall
        base_radiation = 3.5  # kWh/m²/day
        cloud_factor = 0.6
    else:  # Winter
        base_radiation = 2.0  # kWh/m²/day
        cloud_factor = 0.5
        
    # Adjust based on random weather conditions
    weather_conditions = random.choice(["sunny", "partly_cloudy", "cloudy", "rainy"])
    
    if weather_conditions == "sunny":
        weather_factor = 1.0
    elif weather_conditions == "partly_cloudy":
        weather_factor = 0.8
    elif weather_conditions == "cloudy":
        weather_factor = 0.5
    else:
        weather_factor = 0.3
        
    # Calculate average daily radiation with some randomness
    daily_radiation = base_radiation * cloud_factor * weather_factor * random.uniform(0.9, 1.1)
    
    # Generate data for different system sizes
    system_sizes = [3, 5, 10, 15]  # in kW
    systems = []
    
    for size in system_sizes:
        # Efficiency factors
        panel_efficiency = random.uniform(0.18, 0.22)  # 18-22% panel efficiency
        system_losses = random.uniform(0.1, 0.2)  # 10-20% system losses
        
        # Calculate energy production
        daily_kwh = daily_radiation * size * panel_efficiency * (1 - system_losses)
        monthly_kwh = daily_kwh * 30
        annual_kwh = daily_kwh * 365
        
        # CO2 reduction (average 0.5 kg CO2 per kWh replaced)
        co2_reduction = annual_kwh * 0.5  # kg per year
        
        # Cost savings (assume $0.15 per kWh)
        cost_savings_monthly = monthly_kwh * 0.15
        cost_savings_annual = annual_kwh * 0.15
        
        # Payback calculation (system cost estimate)
        system_cost = size * 2500  # $2500 per kW installed
        payback_years = system_cost / cost_savings_annual
        
        # Generate hourly data for today
        hourly_data = []
        for hour in range(24):
            timestamp = (now.replace(hour=hour, minute=0, second=0)).isoformat()
            
            # Solar production follows a bell curve centered at noon
            hour_factor = max(0, 1 - abs(hour - 12) / 6)
            if hour < 6 or hour > 18:  # No/minimal production at night
                hour_factor = 0
                
            hourly_production = daily_kwh * hour_factor * random.uniform(0.9, 1.1) / 12
            
            hourly_data.append({
                "timestamp": timestamp,
                "production_kwh": round(hourly_production, 2)
            })
        
        systems.append({
            "system_size_kw": size,
            "panel_efficiency": round(panel_efficiency * 100, 1),
            "daily_production_kwh": round(daily_kwh, 2),
            "monthly_production_kwh": round(monthly_kwh, 2),
            "annual_production_kwh": round(annual_kwh, 2),
            "co2_reduction_kg_year": round(co2_reduction, 2),
            "cost_savings_monthly": round(cost_savings_monthly, 2),
            "cost_savings_annual": round(cost_savings_annual, 2),
            "estimated_system_cost": round(system_cost, 2),
            "estimated_payback_years": round(payback_years, 1),
            "hourly_data": hourly_data
        })
    
    return {
        "location": {
            "lat": float(lat),
            "lon": float(lon)
        },
        "weather_conditions": weather_conditions,
        "daily_solar_radiation_kwh_m2": round(daily_radiation, 2),
        "systems": systems
    }

@router.get("/estimate")
async def get_solar_estimate(lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON)):
    """Get solar power generation estimates for a location"""
    if not OPENEI_SOLAR_API_KEY or OPENEI_SOLAR_API_KEY == "your_openei_api_key":
        # Return synthetic data if no API key
        return generate_solar_data(lat, lon)
    
    try:
        async with httpx.AsyncClient() as client:
            # Note: In a real application, you would call the OpenEI NREL API here
            # For demo purposes, we'll use synthetic data
            return generate_solar_data(lat, lon)
    except Exception as e:
        # Fallback to synthetic data on any error
        return generate_solar_data(lat, lon)

@router.get("/history/{system_size}")
async def get_solar_history(system_size: int, lat: float = float(DEFAULT_LAT), lon: float = float(DEFAULT_LON)):
    """Get historical solar production for a specific system size"""
    if system_size not in [3, 5, 10, 15]:
        raise HTTPException(status_code=400, detail="Invalid system size. Available sizes: 3, 5, 10, 15 kW")
        
    now = datetime.now()
    
    # Generate 30 days of historical data
    history = []
    for days_ago in range(30, 0, -1):
        day_date = now - timedelta(days=days_ago)
        
        # Randomize production based on weather patterns
        weather_factor = random.uniform(0.5, 1.0)
        
        # Generate basic production estimate for the day
        if system_size == 3:
            base_production = random.uniform(7, 12)
        elif system_size == 5:
            base_production = random.uniform(12, 20)
        elif system_size == 10:
            base_production = random.uniform(24, 40)
        else:  # 15 kW
            base_production = random.uniform(36, 60)
            
        daily_production = base_production * weather_factor
        
        # Weekend vs weekday electricity usage patterns
        if day_date.weekday() >= 5:  # Weekend
            self_consumed = daily_production * random.uniform(0.4, 0.6)  # Lower self-consumption on weekends
        else:
            self_consumed = daily_production * random.uniform(0.2, 0.4)  # Higher self-consumption on weekdays
            
        grid_exported = daily_production - self_consumed
        
        history.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "production_kwh": round(daily_production, 2),
            "self_consumed_kwh": round(self_consumed, 2),
            "grid_exported_kwh": round(grid_exported, 2)
        })
    
    return {
        "system_size_kw": system_size,
        "location": {
            "lat": float(lat),
            "lon": float(lon)
        },
        "history": history,
        "total_produced_kwh": round(sum(day["production_kwh"] for day in history), 2),
        "total_self_consumed_kwh": round(sum(day["self_consumed_kwh"] for day in history), 2),
        "total_grid_exported_kwh": round(sum(day["grid_exported_kwh"] for day in history), 2)
    }