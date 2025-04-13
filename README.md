# SmartCityPulse
## -so-cool-buddies_AMUHACKS4.0
### #AMUHACKS 4.0 #CSSAMU #AMU

A comprehensive Smart City dashboard that provides real-time information on city services, infrastructure, and environmental conditions.

## Features

- **Weather Dashboard**: Real-time weather data and forecasts
- **Traffic Monitoring**: Live traffic conditions, incidents, and congestion information
- **Air Quality Index**: Current air quality measurements and health recommendations
- **Solar Energy**: Solar panel efficiency and renewable energy production metrics
- **Waste Management**: Collection schedules and recycling information
- **Public Transit**: Bus and train schedules with real-time updates
- **City Alerts**: Important notifications and emergency broadcasts
- **Interactive Map**: Location-based services and facility information
- **Reporting System**: Submit issues about city infrastructure
- **AI Chatbot**: Location-aware virtual assistant for city information

## Technology Stack

### Frontend
- React with TypeScript
- Material-UI component library
- Location services integration
- Responsive design for mobile and desktop

### Backend
- FastAPI (Python)
- RESTful API architecture
- Environment variable configuration
- CORS middleware for cross-origin requests

### External Services
- OpenWeatherMap API (weather data)
- Mapbox API (mapping services)
- Google Maps API (location services)
- Google Gemini API (AI chatbot)
- Various city service data sources

## Getting Started

### Prerequisites
- Node.js and npm for frontend
- Python 3.8+ for backend
- API keys for external services

### Environment Setup
Create a `.env` file in the backend directory with the following variables:
```
# Default location coordinates
DEFAULT_LAT=your_default_latitude
DEFAULT_LON=your_default_longitude
DEFAULT_CITY=your_default_city

# API Keys
OPENWEATHERMAP_API_KEY=your_openweathermap_key
OPENAQ_API_KEY=your_openaq_key
OPENSENSEMAP_API_KEY=your_opensensemap_key
OPENEI_SOLAR_API_KEY=your_solar_key
TOMTOM_API_KEY=your_tomtom_key
GEMINI_API_KEY=your_gemini_key

# Other configuration
DEBUG=True
```

### Installation

#### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Allow location access when prompted to enable location-based features
2. Navigate through different sections using the sidebar menu
3. Use the chatbot for quick information about city services
4. Check real-time data in various dashboards
5. Report issues through the reporting system

## Known Issues

- Some features may not work if API keys are missing
- The chatbot falls back to predefined responses when the Gemini API is unavailable
- Weather forecasts require valid location data

## Future Improvements

- Add user authentication system
- Implement more city-specific datasets
- Enhance AI assistant capabilities
- Add mobile app versions
- Improve accessibility features
