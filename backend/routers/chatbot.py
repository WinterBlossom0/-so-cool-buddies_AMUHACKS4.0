from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random
import re
from datetime import datetime
import json
import httpx
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/chatbot",
    tags=["chatbot"],
    responses={404: {"description": "Not found"}},
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    logger.info("Gemini API key is configured")
else:
    logger.warning("Gemini API key is not configured. Using fallback responses.")

# Models
class ChatRequest(BaseModel):
    user_id: str
    message: str
    location: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: str
    suggestions: List[str] = []
    context_aware: bool = False

# In-memory storage for chat sessions
chat_sessions = {}

# Simple predefined responses when Gemini API is not available
responses = {
    "hello": ["Hello! How can I help you today?", "Hi there! What can I assist you with?", "Welcome to SmartCityPulse! How may I help you?"],
    "help": ["I can help with information about traffic, weather, air quality, and city services.", 
             "I'm your SmartCityPulse assistant. Ask me about weather forecasts, traffic conditions, or local events!",
             "I can provide information about various city services, report issues, or check local conditions."],
    "weather": ["The weather forecast is available on the Weather page. Would you like me to navigate you there?",
                "You can check detailed weather information on the Weather tab.",
                "Today's weather information is accessible through the Weather dashboard."],
    "traffic": ["Traffic information is available on the Traffic page. Would you like directions to avoid congestion?",
                "Current traffic conditions can be viewed on the Traffic tab.",
                "I can help you find the best routes by checking the Traffic section."],
    "air quality": ["Air quality information is available on the Air Quality page.",
                    "Check the Air Quality tab for pollution levels and recommendations.",
                    "Current air quality metrics and health recommendations can be found in the Air Quality section."],
    "events": ["There are several community events happening this week. Check the Events tab for details.",
               "The city calendar shows upcoming events and activities.",
               "You can find information about local events, festivals, and community gatherings in the Events section."],
    "emergency": ["For emergencies, please call 911 immediately. Safety is our top priority.",
                  "Emergency services can be reached at 911. Please call them directly for urgent situations.",
                  "If this is an emergency, please contact 911. For non-emergency reports, use our Report feature."],
    "report": ["You can report issues through the Report tab.",
               "To report a problem in your area, use the Report feature.",
               "The Report section allows you to notify city services about issues like potholes, broken lights, or graffiti."],
    "solar": ["Solar energy information is available in the Solar dashboard.",
              "You can check solar panel efficiency and energy production in the Solar section.",
              "The Solar dashboard provides real-time data on renewable energy generation."],
    "waste": ["Information about waste collection and recycling is available in the Waste Management section.",
              "You can check waste pickup schedules and recycling guidelines in the dedicated dashboard.",
              "The Waste Management section helps you track collection schedules and proper disposal methods."],
    "transit": ["Public transportation information is available in the Transit section.",
                "You can check bus and train schedules in the Transit dashboard.",
                "The Transit section provides real-time updates on public transportation."],
    "alerts": ["Current city alerts are available in the Alerts dashboard.",
               "You can subscribe to important notifications in the Alerts section.",
               "Check the Alerts section for important city-wide notifications and updates."],
    "time": [f"The current time is {datetime.now().strftime('%H:%M')}.",
             f"It's currently {datetime.now().strftime('%I:%M %p')}.",
             f"The time is now {datetime.now().strftime('%H:%M')}"],
    "date": [f"Today is {datetime.now().strftime('%A, %B %d, %Y')}.",
             f"It's {datetime.now().strftime('%A, %B %d, %Y')}.",
             f"Today's date is {datetime.now().strftime('%d/%m/%Y')}."],
    "thank": ["You're welcome! Is there anything else I can help with?",
              "Happy to help! Let me know if you need anything else.",
              "Anytime! Do you have any other questions about the city services?"]
}

suggestions = {
    "hello": ["Show me the weather", "Traffic conditions", "Air quality today"],
    "weather": ["Is it going to rain?", "Temperature forecast", "Weather alerts"],
    "traffic": ["Traffic on Main Street", "Fastest route downtown", "Road closures"],
    "air quality": ["Is air quality good today?", "Pollution levels", "Health recommendations"],
    "events": ["Weekend events", "Community activities", "City calendar"],
    "report": ["Report broken streetlight", "Report pothole", "Report graffiti"],
    "solar": ["Solar energy production", "Panel efficiency", "Energy savings"],
    "waste": ["Waste collection schedule", "Recycling guidelines", "Hazardous waste disposal"],
    "transit": ["Next bus arrival", "Train schedule", "Transit routes"],
    "alerts": ["Current city alerts", "Subscribe to notifications", "Emergency broadcasts"],
    "time": ["What's the weather?", "Upcoming events", "Traffic conditions"],
    "date": ["Events today", "Waste collection today", "Today's alerts"],
    "thank": ["Weather forecast", "Traffic conditions", "Report an issue"]
}

# Fallback responses when no keywords match
fallback_responses = [
    "I'm not sure I understand. Could you rephrase that?",
    "I don't have information about that yet, but I'm learning!",
    "I couldn't find specific information about that. Would you like to know about weather, traffic, or city services instead?",
    "I'm sorry, I don't have data on that topic. Is there something else I can help with?"
]

fallback_suggestions = ["Weather forecast", "Traffic conditions", "Air quality", "Report an issue", "City events"]

# Context awareness for multi-turn conversations
user_contexts = {}

async def get_weather_data(lat, lon):
    """Get weather data based on coordinates"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://localhost:8000/api/weather/current",
                params={"lat": lat, "lon": lon}
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"Error fetching weather data: {e}")
        return None

async def get_traffic_data(lat, lon):
    """Get traffic data based on coordinates"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://localhost:8000/api/traffic/nearby",
                params={"lat": lat, "lon": lon}
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"Error fetching traffic data: {e}")
        return None

async def get_solar_data(lat, lon):
    """Get solar panel data based on coordinates"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://localhost:8000/api/solar/efficiency",
                params={"lat": lat, "lon": lon}
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"Error fetching solar data: {e}")
        return None

async def ask_gemini(user_query, location_data, context_data):
    """Query Gemini API with user message and location context"""
    if not GEMINI_API_KEY:
        logger.warning("Gemini API key not available for query")
        return None
    
    try:
        # We'll use httpx to make a direct API call to Google's Gemini API
        # since some environments might have issues with the Python client library
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        
        # Format the coordinates in a user-friendly way
        lat = location_data.get("lat") 
        lon = location_data.get("lon")
        city = location_data.get("city", "Unknown location")
        
        # Create context from data
        context = f"""
Location: {city}
Coordinates: {lat}, {lon}
Weather data: {json.dumps(context_data.get('weather', {}), indent=2)}
Traffic data: {json.dumps(context_data.get('traffic', {}), indent=2)}
Solar data: {json.dumps(context_data.get('solar', {}), indent=2)}

You are SmartCityPulse's AI assistant that helps users with city information. 
You have access to real-time data about this location from our city services.
Please respond to the user's query using the location information and data provided.
Keep your response concise, informative, and relevant to the location.
"""
        
        prompt = f"User query: {user_query}\n\n{context}"
        
        # Prepare the request payload
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1024
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, 
                json=payload,
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                response_data = response.json()
                logger.info("Successfully received response from Gemini API")
                # Extract the response text from the API response
                if (response_data.get("candidates") and 
                    response_data["candidates"][0].get("content") and 
                    response_data["candidates"][0]["content"].get("parts")):
                    return response_data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                
        # If we reach here, something went wrong
        return None
        
    except Exception as e:
        logger.error(f"Gemini API request error: {str(e)}")
        return None

@router.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatRequest):
    user_id = chat_message.user_id
    user_message = chat_message.message.lower()
    user_location = chat_message.location
    
    logger.info(f"Received chat request from user {user_id}: {user_message[:50]}...")
    
    # Initialize or retrieve user context
    if user_id not in user_contexts:
        user_contexts[user_id] = {
            "last_topic": None,
            "interaction_count": 0,
            "history": []
        }
    
    user_contexts[user_id]["interaction_count"] += 1
    user_contexts[user_id]["history"].append({
        "message": user_message,
        "timestamp": datetime.now().isoformat()
    })
    
    # Try to use Gemini API with location context if available
    context_aware = False
    if user_location and "lat" in user_location and "lon" in user_location:
        # Gather context data for Gemini
        context_data = {
            "weather": await get_weather_data(user_location["lat"], user_location["lon"]),
            "traffic": await get_traffic_data(user_location["lat"], user_location["lon"]),
            "solar": await get_solar_data(user_location["lat"], user_location["lon"])
        }
        
        # Ask Gemini with the location context
        gemini_response = await ask_gemini(user_message, user_location, context_data)
        
        if gemini_response:
            context_aware = True
            logger.info(f"Returning Gemini-generated response to user {user_id}")
            return ChatResponse(
                message=gemini_response,
                suggestions=["Weather update", "Traffic conditions", "Solar efficiency"],
                context_aware=True
            )
    
    # Fallback to keyword-based responses if Gemini not available
    logger.info(f"Using keyword matching for user {user_id}")
    # Check for keywords in the message
    matched_topic = None
    for keyword, response_list in responses.items():
        if keyword in user_message or (user_contexts[user_id]["last_topic"] == keyword and 
                                      any(re.search(r'\b(yes|yeah|sure|okay|ok)\b', user_message))):
            matched_topic = keyword
            user_contexts[user_id]["last_topic"] = keyword
            return ChatResponse(
                message=random.choice(response_list),
                suggestions=suggestions.get(keyword, fallback_suggestions)
            )
    
    # Location-aware responses if location is provided
    if user_location and "lat" in user_location and "lon" in user_location:
        if "near me" in user_message or "nearby" in user_message:
            return ChatResponse(
                message=f"I can see you're at coordinates ({user_location['lat']:.4f}, {user_location['lon']:.4f}) in {user_location.get('city', 'your area')}. You can check services near you on the Map tab.",
                suggestions=["Nearby facilities", "Local traffic", "Events near me"]
            )
    
    # If no keyword matches, return a fallback response
    logger.info(f"No keyword match found for user {user_id}, using fallback response")
    return ChatResponse(
        message=random.choice(fallback_responses),
        suggestions=fallback_suggestions
    )

@router.get("/health")
async def health_check():
    gemini_status = "available" if GEMINI_API_KEY else "unavailable"
    return {
        "status": "healthy", 
        "service": "chatbot",
        "gemini_api": gemini_status,
        "sessions": len(user_contexts)
    }

# Utility endpoint to clear a user's context if needed
@router.post("/reset_context/{user_id}")
async def reset_context(user_id: str):
    if user_id in user_contexts:
        user_contexts[user_id] = {
            "last_topic": None,
            "interaction_count": 0,
            "history": []
        }
        return {"status": "success", "message": f"Context for user {user_id} has been reset"}
    return {"status": "not_found", "message": f"No context found for user {user_id}"}
