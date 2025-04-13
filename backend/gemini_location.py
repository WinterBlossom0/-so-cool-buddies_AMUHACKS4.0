import base64
import os
import requests
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def geocode_location(place_name):
    """Convert a place name to latitude and longitude using Nominatim API"""
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={place_name}&format=json&limit=1"
        headers = {'User-Agent': 'SmartCityApp/1.0'}
        response = requests.get(url, headers=headers)
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
            return None
    except Exception as e:
        print(f"Geocoding error: {str(e)}")
        return None

def get_location_data(latitude, longitude):
    """Fetch data for the given coordinates using an API"""
    # Replace with your actual API endpoint to fetch data based on coordinates
    try:
        # Example API call - modify to use your actual data service
        # This could be weather data, air quality, or other location-specific data
        api_url = f"https://api.example.com/data?lat={latitude}&lon={longitude}"
        # response = requests.get(api_url)
        # return response.json()
        
        # For testing purposes, return mock data
        return {
            "coordinates": {"lat": latitude, "lon": longitude},
            "data": {
                "temperature": 22.5,
                "humidity": 65,
                "air_quality_index": 42
                # Additional data fields would go here
            }
        }
    except Exception as e:
        print(f"API fetch error: {str(e)}")
        return {"error": str(e)}

def generate():
    """CLI tool to use Gemini API with location data"""
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )
    
    # Get user input and location
    user_input = input("Enter your query: ")
    location = input("Enter a location (or leave blank to extract from query): ")
    
    # If location is blank, try to extract from the query
    if not location and len(user_input.split()) > 0:
        location = user_input.split()[-1]
    
    # Geocode the location
    location_data = None
    if location:
        print(f"Geocoding location: {location}")
        location_data = geocode_location(location)
        
        if location_data:
            print(f"Found coordinates: {location_data['latitude']}, {location_data['longitude']}")
            additional_data = get_location_data(location_data['latitude'], location_data['longitude'])
            
            context = f"""
Location: {location_data['display_name']}
Coordinates: {location_data['latitude']}, {location_data['longitude']}
Additional data: {json.dumps(additional_data, indent=2)}
            """
        else:
            print(f"Could not geocode location: {location}")
            context = ""
    else:
        context = ""
    
    # Prepare prompt with location context
    prompt = f"""
User query: {user_input}

{context}

Please respond to the user's query using the location information and data provided.
    """
    
    print("\nSending to Gemini API...")
    
    model = "gemini-2.0-flash"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]
    
    generate_content_config = types.GenerateContentConfig(
        temperature=0,
        response_mime_type="text/plain",
    )
    
    print("\nResponse:")
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()