from fastapi import APIRouter, HTTPException, Body
import os
import httpx
import json
import random
from datetime import datetime
from dotenv import load_dotenv
from typing import List, Optional

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api/chatbot",
    tags=["chatbot"],
    responses={404: {"description": "Not found"}},
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

# In-memory storage for chat history
chat_sessions = {}

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

async def get_gemini_response(user_message, conversation_history=None):
    """Get a response from Google's Gemini API"""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key":
        return generate_synthetic_response(user_message)
    
    try:
        # Prepare conversation context
        context = "You are a helpful Smart City assistant providing information about city services, weather, transit, air quality, and helping citizens. Your responses should be concise, informative, and focused on city-related topics. If asked about something you can't provide (like personal information or non-city services), politely redirect to relevant city information."
        
        # Prepare conversation history in the format Gemini expects
        messages = []
        
        if conversation_history:
            for exchange in conversation_history:
                messages.append({
                    "role": "user",
                    "parts": [{"text": exchange["user_message"]}]
                })
                messages.append({
                    "role": "model",
                    "parts": [{"text": exchange["assistant_response"]}]
                })
        
        # Add current user message
        messages.append({
            "role": "user",
            "parts": [{"text": user_message}]
        })
        
        # Construct the request payload
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": context}]
                }
            ] + messages,
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 200,
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GEMINI_API_URL,
                headers=headers,
                json=payload,
                timeout=10.0
            )
            
            if response.status_code != 200:
                # Fallback to synthetic response on API error
                return generate_synthetic_response(user_message)
            
            response_data = response.json()
            
            # Extract the assistant's response
            if "candidates" in response_data and response_data["candidates"]:
                candidate = response_data["candidates"][0]
                if "content" in candidate and candidate["content"]["parts"]:
                    return candidate["content"]["parts"][0]["text"]
            
            # If we couldn't extract a response, fall back to synthetic
            return generate_synthetic_response(user_message)
            
    except Exception as e:
        # Fallback to synthetic response on any error
        return generate_synthetic_response(user_message)

@router.post("/chat")
async def chat_with_ai(request: dict = Body(...)):
    """Chat with the city AI assistant"""
    user_message = request.get("message", "")
    session_id = request.get("session_id", "default")
    
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Initialize session if it doesn't exist
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []
    
    # Get conversation history
    conversation_history = chat_sessions[session_id]
    
    # Get response from AI
    assistant_response = await get_gemini_response(user_message, conversation_history)
    
    # Save the exchange to history
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
        "timestamp": datetime.now().isoformat()
    }

@router.get("/sessions/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a specific session"""
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