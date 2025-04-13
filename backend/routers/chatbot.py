from fastapi import APIRouter, HTTPException, Body, Request
import os
import httpx
import json
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from typing import List, Optional
import base64
import requests
import google.generativeai as genai
from google.genai import types
from google.generativeai.types import GenerationConfig
import logging
import threading

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO if os.getenv("DEBUG") == "True" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("smart_city.chatbot")

# Default location settings
DEFAULT_LAT = os.getenv("DEFAULT_LAT", "51.5074") 
DEFAULT_LON = os.getenv("DEFAULT_LON", "-0.1278")

router = APIRouter(
    prefix="/api/chatbot",
    tags=["chatbot"],
    responses={404: {"description": "Not found"}},
)

# Initialize Gemini API with the key from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key":
    genai.configure(api_key=GEMINI_API_KEY)

# In-memory storage for chat history with thread safety
chat_sessions = {}
session_lock = threading.RLock()
SESSION_EXPIRY = 24  # Hours before a session expires

def clean_expired_sessions():
    """Clean up expired chat sessions"""
    expiry_time = datetime.now() - timedelta(hours=SESSION_EXPIRY)
    with session_lock:
        expired_sessions = []
        for session_id, history in chat_sessions.items():
            if history and history[-1].get('timestamp'):
                last_activity = datetime.fromisoformat(history[-1]['timestamp'])
                if last_activity < expiry_time:
                    expired_sessions.append(session_id)
        
        # Remove expired sessions
        for session_id in expired_sessions:
            del chat_sessions[session_id]
            logger.info(f"Expired session removed: {session_id}")

# Run session cleanup periodically
def schedule_cleanup():
    clean_expired_sessions()
    # Schedule next cleanup in 1 hour
    threading.Timer(3600, schedule_cleanup).start()

# Start the cleanup scheduler when the module is loaded
schedule_cleanup()

def generate_synthetic_response(user_message):
    """Generate synthetic chatbot response if API key isn't available"""
    # Sample responses based on keywords in user message
    keywords_responses = {
        "weather": [
            "Today's weather is partly cloudy with a high of 72°F and a low of 58°F.",
            "The forecast shows a 30% chance of rain later today.",
            "It's currently sunny with a temperature of 68°F."
        ],
        "air quality": [
            "The current air quality index (AQI) is 42, which is in the good range.",
            "Air quality today is moderate with a PM2.5 level of 12.4 μg/m³.",
            "The air quality has improved since yesterday and is now in the healthy range."
        ],
        "waste": [
            "Recycling collection is scheduled for tomorrow morning.",
            "The nearest waste collection point is at Central Park, about 0.5 miles from your location.",
            "The waste bin at Main Street is currently at 85% capacity and scheduled for collection soon."
        ],
        "transit": [
            "The next bus on Route 10 will arrive in approximately 5 minutes.",
            "There are currently delays on the subway line due to maintenance work.",
            "The nearest transit stop is 2 blocks away at Market Street."
        ],
        "report": [
            "You can submit an issue report through our citizen portal or using the report form in this app.",
            "Your recent report about the broken street light has been received and is under review.",
            "The city has addressed 85% of citizen reports submitted in the last month."
        ],
        "solar": [
            "Based on your location, a 5kW solar system could generate approximately 7,500 kWh annually.",
            "The average payback period for solar installations in your area is about 6-8 years.",
            "Today's solar energy production potential is high due to clear skies."
        ],
        "hello": [
            "Hello! I'm your Smart City assistant. How can I help you today?",
            "Hi there! I can help you with information about weather, transit, city services, and more.",
            "Greetings! I'm here to answer your questions about our city."
        ]
    }
    
    # General responses for when no keywords match
    general_responses = [
        "I can provide information about weather, air quality, transit, waste management, and city services. What would you like to know?",
        "I'm still learning about our city. Could you ask about specific services like weather, transit, or reports?",
        "I'm not sure I understand. I can help with weather forecasts, air quality data, transit information, or submitting city reports.",
        "As your city assistant, I can access information about local weather, transit schedules, air quality, and help you report issues."
    ]
    
    # Check for keywords in user message
    user_message_lower = user_message.lower()
    
    for keyword, responses in keywords_responses.items():
        if keyword in user_message_lower:
            return random.choice(responses)
    
    return random.choice(general_responses)

def geocode_location(place_name):
    """Convert a place name to latitude and longitude using Nominatim API"""
    if not place_name:
        return None
        
    try:
        # Add error handling for comma-separated coordinates
        if ',' in place_name and len(place_name.split(',')) == 2:
            try:
                lat, lon = map(float, place_name.strip().split(','))
                return {
                    'latitude': lat,
                    'longitude': lon,
                    'display_name': f"Coordinates: {lat}, {lon}"
                }
            except ValueError:
                # Not valid coordinates, continue with geocoding
                pass
                
        url = f"https://nominatim.openstreetmap.org/search?q={place_name}&format=json&limit=1"
        headers = {'User-Agent': 'SmartCityApp/1.0'}
        response = requests.get(url, headers=headers, timeout=5)
        data = response.json()
        
        if data and len(data) > 0:
            latitude = float(data[0]['lat'])
            longitude = float(data[0]['lon'])
            return {
                'latitude': latitude,
                'longitude': longitude,
                'display_name': data[0].get('display_name', place_name)
            }
        else:
            logger.warning(f"Location not found: {place_name}")
            # Return fallback coordinates with a note that location wasn't found
            return {
                'latitude': float(DEFAULT_LAT),
                'longitude': float(DEFAULT_LON),
                'display_name': f"Unknown location: {place_name} (using default city)"
            }
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}", exc_info=True)
        # Return fallback coordinates on error
        return {
            'latitude': float(DEFAULT_LAT),
            'longitude': float(DEFAULT_LON),
            'display_name': "Default location (geocoding failed)"
        }

def get_location_data(latitude, longitude):
    """Fetch data for the given coordinates using external APIs"""
    try:
        result = {
            "coordinates": {"lat": latitude, "lon": longitude},
        }
        
        # Weather data from OpenWeatherMap
        weather_api_key = os.getenv("OPENWEATHERMAP_API_KEY")
        if weather_api_key and weather_api_key != "your_openweathermap_api_key":
            try:
                weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={weather_api_key}&units=metric"
                weather_response = requests.get(weather_url, timeout=5)
                if weather_response.status_code == 200:
                    result["weather"] = weather_response.json()
                else:
                    result["weather"] = {"error": "Weather data unavailable", "code": weather_response.status_code}
            except Exception as e:
                logger.error(f"Weather API error: {str(e)}")
                result["weather"] = {"error": str(e), "service": "OpenWeatherMap"}
        else:
            result["weather"] = {"temp": 22.5, "humidity": 65, "description": "clear sky", "note": "Using mock data, no API key provided"}
        
        # Air quality data
        aqi_api_key = os.getenv("OPENAQ_API_KEY")
        if aqi_api_key and aqi_api_key != "your_openaq_api_key":
            try:
                aqi_url = f"https://api.openaq.org/v2/latest?coordinates={latitude},{longitude}&radius=10000"
                aqi_response = requests.get(aqi_url, timeout=5)
                if aqi_response.status_code == 200:
                    result["air_quality"] = aqi_response.json()
                else:
                    result["air_quality"] = {"error": "AQI data unavailable", "code": aqi_response.status_code}
            except Exception as e:
                logger.error(f"Air quality API error: {str(e)}")
                result["air_quality"] = {"error": str(e), "service": "OpenAQ"}
        else:
            result["air_quality"] = {"aqi": 42, "pm25": 12.4, "note": "Using mock data, no API key provided"}
        
        # Traffic data from TomTom API
        tomtom_api_key = os.getenv("TOMTOM_API_KEY")
        if tomtom_api_key and tomtom_api_key != "your_tomtom_api_key":
            try:
                # Traffic flow data
                traffic_url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
                traffic_params = {
                    "key": tomtom_api_key,
                    "point": f"{latitude},{longitude}",
                    "unit": "kmph"
                }
                traffic_response = requests.get(traffic_url, params=traffic_params, timeout=5)
                
                if traffic_response.status_code == 200:
                    result["traffic"] = traffic_response.json()
                else:
                    result["traffic"] = {"error": "Traffic data unavailable", "code": traffic_response.status_code}
            except Exception as e:
                logger.error(f"TomTom API error: {str(e)}")
                result["traffic"] = {"error": str(e), "service": "TomTom"}
        else:
            result["traffic"] = {
                "note": "Using mock data, TomTom API key not provided or invalid",
                "current_speed": 35,
                "free_flow_speed": 45,
                "congestion": "moderate"
            }
            
        # Solar data from OpenEI API
        solar_api_key = os.getenv("OPENEI_SOLAR_API_KEY")
        if solar_api_key and solar_api_key != "your_openei_api_key":
            try:
                solar_url = "https://developer.nrel.gov/api/pvwatts/v6.json"
                solar_params = {
                    "api_key": solar_api_key,
                    "lat": latitude,
                    "lon": longitude,
                    "system_capacity": 5,  # 5 kW system as default
                    "module_type": 0,      # Standard module type
                    "array_type": 1,       # Fixed roof mount
                    "tilt": 20,            # 20 degree tilt
                    "azimuth": 180,        # South facing
                    "timeframe": "monthly"
                }
                
                solar_response = requests.get(solar_url, params=solar_params, timeout=5)
                if solar_response.status_code == 200:
                    solar_data = solar_response.json()
                    # Simplify for the chatbot by extracting just key information
                    if "outputs" in solar_data:
                        result["solar"] = {
                            "annual_production": solar_data["outputs"].get("ac_annual"),
                            "monthly_data": solar_data["outputs"].get("ac_monthly"),
                            "source": "NREL PVWatts API"
                        }
                    else:
                        result["solar"] = {"error": "Solar data format unexpected", "service": "NREL PVWatts"}
                else:
                    result["solar"] = {"error": "Solar data unavailable", "code": solar_response.status_code}
            except Exception as e:
                logger.error(f"Solar API error: {str(e)}")
                result["solar"] = {"error": str(e), "service": "NREL PVWatts"}
        else:
            result["solar"] = {
                "note": "Using mock data, Solar API key not configured",
                "annual_production": 7500,
                "avg_monthly": 625
            }
                
        return result
    except Exception as e:
        logger.error(f"Location data aggregation error: {str(e)}", exc_info=True)
        return {"error": str(e), "coordinates": {"lat": latitude, "lon": longitude}}

async def get_gemini_response(user_message, conversation_history=None, location=None):
    """Get a response from Google's Gemini API using the latest SDK"""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key":
        logger.warning("No valid Gemini API key found, using synthetic responses")
        return generate_synthetic_response(user_message)
    
    try:
        # Log the request for debugging
        logger.debug(f"Generating response for: '{user_message[:50]}...'")
        
        # Create a chat history context if available
        location_context = ""
        
        if location:
            location_context = f"\nThe user is located in: {location}\n"
        
        # System prompt with city assistant context and location
        system_prompt = f"""You are a helpful Smart City assistant providing information about city services, 
weather, transit, air quality, and helping citizens with their queries.
Your responses should be concise, informative, and focused on city-related topics.
If asked about something you can't provide (like personal information or non-city services), 
politely redirect to relevant city information.{location_context}"""
        
        # Set up client
        client = genai.Client(
            api_key=GEMINI_API_KEY,
        )
        
        # Prepare prompt with system context and user message
        full_prompt = f"{system_prompt}\n\nUser: {user_message}"
        
        # Add conversation history if available for context
        if conversation_history and len(conversation_history) > 0:
            history_text = "\n\nPrevious conversation:\n"
            # Include last 3 exchanges to avoid token limits
            for exchange in conversation_history[-3:]:
                history_text += f"User: {exchange['user_message']}\n"
                history_text += f"Assistant: {exchange['assistant_response']}\n"
            full_prompt = f"{system_prompt}\n{history_text}\nUser: {user_message}"
        
        # Create content for the model using the updated types import
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=full_prompt),
                ],
            ),
        ]
        
        # Configure the generation parameters
        generate_content_config = types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=300,
            response_mime_type="text/plain",
        )
        
        # Generate the response
        model = "gemini-1.5-flash"
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )
        
        if response and hasattr(response, 'text'):
            logger.debug(f"Response generated: '{response.text[:50]}...'")
            return response.text
        else:
            logger.warning("Empty or invalid response from Gemini API")
            return generate_synthetic_response(user_message)
            
    except Exception as e:
        logger.error(f"Error with Gemini API: {str(e)}", exc_info=True)
        # Fallback to synthetic response on any error
        return generate_synthetic_response(user_message)

@router.post("/chat")
async def chat_with_ai(request: dict = Body(...)):
    """Chat with the city AI assistant"""
    user_message = request.get("message", "")
    session_id = request.get("session_id", "default")
    location = request.get("location", None)
    
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Initialize session if it doesn't exist
    with session_lock:
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []
    
    # Log chatbot usage
    logger.info(f"Chat request received: session={session_id}, location={location}, msg_length={len(user_message)}")
    
    # Get conversation history
    with session_lock:
        conversation_history = chat_sessions[session_id]
    
    # Geocode the location if provided
    location_data = None
    if location:
        location_data = geocode_location(location)
    
    # Get response from AI, passing location data if available
    assistant_response = await get_gemini_response(
        user_message, 
        conversation_history, 
        location_data["display_name"] if location_data else None
    )
    
    # Log response
    logger.info(f"Chat response sent: session={session_id}, response_length={len(assistant_response)}")
    
    # Save the exchange to history
    with session_lock:
        conversation_history.append({
            "user_message": user_message,
            "assistant_response": assistant_response,
            "timestamp": datetime.now().isoformat()
        })
    
        # Limit history to last 10 exchanges to avoid token limits
        if len(conversation_history) > 10:
            conversation_history = conversation_history[-10:]
    
        chat_sessions[session_id] = conversation_history
    
    return {
        "response": assistant_response,
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "location_data": location_data
    }

@router.post("/query")
async def process_query(request: Request):
    """Process user queries and return responses using Gemini API"""
    try:
        data = await request.json()
        user_input = data.get("query", "")
        location = data.get("location", None)
        
        # Log query usage
        logger.info(f"Query request received: location={location}, query_length={len(user_input)}")
        
        # If no location was provided in the request, try to extract it from the user input
        if not location:
            # Use a more sophisticated approach to extract location from query
            # This is a simplified approach that looks for location indicators
            location_indicators = ["in", "at", "near", "around", "for"]
            words = user_input.lower().split()
            
            for i, word in enumerate(words):
                if word in location_indicators and i < len(words) - 1:
                    # Take the word after the location indicator as potential location
                    location = words[i+1]
                    if i+2 < len(words):  # Include the next word if available (e.g., "New York")
                        location += " " + words[i+2]
                    break
            
            # If no location indicator found, use fallback of last word
            if not location and len(words) > 2:
                location = words[-1]
        
        logger.debug(f"Extracted location: {location}")
        
        # Geocode the location
        location_data = None
        if location:
            location_data = geocode_location(location)
            if not location_data:
                logger.warning(f"Failed to geocode location: {location}")
        
        # Set up Gemini API client
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key":
            return {"response": generate_synthetic_response(user_input), "location_data": location_data}
            
        try:
            client = genai.Client(
                api_key=GEMINI_API_KEY,
            )
            
            # Prepare context with location data if available
            context = ""
            if location_data:
                try:
                    # Fetch additional data for this location
                    additional_data = get_location_data(
                        location_data['latitude'], 
                        location_data['longitude']
                    )
                    
                    # Only include essential data to avoid complex nested structures that could cause JSON issues
                    simplified_data = {
                        "coordinates": additional_data.get("coordinates", {}),
                        "weather": {
                            "temperature": additional_data.get("weather", {}).get("main", {}).get("temp", "N/A"),
                            "conditions": additional_data.get("weather", {}).get("weather", [{}])[0].get("description", "N/A") 
                            if additional_data.get("weather", {}).get("weather", []) else "N/A"
                        },
                        "traffic": {
                            "congestion": additional_data.get("traffic", {}).get("congestion", "N/A"),
                            "current_speed": additional_data.get("traffic", {}).get("current_speed", "N/A")
                        },
                        "solar": {
                            "annual_production": additional_data.get("solar", {}).get("annual_production", "N/A")
                        }
                    }
                    
                    context = f"""
Location: {location_data['display_name']}
Coordinates: {location_data['latitude']}, {location_data['longitude']}

Weather: {simplified_data['weather']['temperature']}°C, {simplified_data['weather']['conditions']}
Traffic: Congestion level {simplified_data['traffic']['congestion']}
Solar potential: {simplified_data['solar']['annual_production']} kWh annual production estimate
                    """
                except Exception as e:
                    logger.error(f"Error processing location data: {str(e)}")
                    context = f"""
Location: {location_data['display_name']}
Coordinates: {location_data['latitude']}, {location_data['longitude']}
Additional data: Unable to fetch
                    """
            
            # Prepare prompt with location context
            prompt = f"""
User query: {user_input}

{context}

Please respond to the user's query using the location information and data provided.
Focus on city-related information like weather, traffic, solar potential, and other urban services.
            """
            
            model = "gemini-1.5-flash"
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=prompt),
                    ],
                ),
            ]
            
            generate_content_config = types.GenerateContentConfig(
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=300,
                response_mime_type="text/plain",
            )
            
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=generate_content_config,
            )
            
            # Ensure we have a valid text response
            response_text = ""
            if response and hasattr(response, 'text'):
                response_text = response.text
            else:
                response_text = "I couldn't generate a proper response. Please try again."
                
            # Log response before return
            logger.info(f"Query response sent: response_length={len(response_text)}")
            
            # Return a properly formatted JSON response
            return {
                "response": response_text, 
                "location_data": location_data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}", exc_info=True)
            return {
                "response": f"I'm having trouble accessing city data right now. Please try again later.",
                "location_data": location_data,
                "timestamp": datetime.now().isoformat(),
                "error": "API error"
            }
            
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        # Return a properly formatted error response that can be parsed as JSON
        return {
            "response": "There was an error processing your request. Please try again.",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/sessions/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a specific session"""
    with session_lock:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        return {
            "session_id": session_id,
            "history": chat_sessions[session_id],
            "message_count": len(chat_sessions[session_id])
        }

@router.delete("/sessions/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a specific session"""
    with session_lock:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        chat_sessions[session_id] = []
        return {
            "session_id": session_id,
            "message": "Chat history cleared successfully"
        }

@router.get("/suggested-prompts")
async def get_suggested_prompts():
    """Get suggested prompts for the chatbot"""
    prompts = [
        "What's the weather forecast for today?",
        "How's the air quality in the downtown area?",
        "When is the next bus arriving at Central Station?",
        "How can I report a pothole on my street?",
        "What's the status of my recent report about the broken streetlight?",
        "How much energy could I save with solar panels?",
        "Are there any active alerts in my area?",
        "Where is the nearest recycling center?",
        "How full are the waste bins in the park?",
        "What are the most reported issues in my neighborhood?"
    ]
    return {
        "prompts": prompts
    }