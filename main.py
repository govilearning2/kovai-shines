from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import requests
import os
from typing import Optional, Dict, Any, List
import uvicorn
from datetime import datetime, timedelta
import google.generativeai as genai


app = FastAPI(
    title="Location Coordinate Service",
    description="Get latitude and longitude for places using Google APIs, calculate routes, and get weather",
    version="1.0.0"
)

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "api-key")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "api-key")
genai.configure(api_key=GEMINI_API_KEY)


# Response models
class CoordinateResponse(BaseModel):
    place_name: str
    latitude: float
    longitude: float
    formatted_address: str
    place_id: Optional[str] = None
    api_used: str


class WeatherInfo(BaseModel):
    temperature: Optional[float] = None
    feels_like: Optional[float] = None
    humidity: Optional[int] = None
    description: str
    condition: str
    wind_speed: Optional[float] = None
    visibility: Optional[float] = None
    location_name: str
    data_source: str


class RouteInfo(BaseModel):
    duration_text: str
    duration_seconds: int
    distance_text: str
    distance_meters: int
    travel_mode: str


class TravelPlanResponse(BaseModel):
    source: Dict[str, float]
    destination: Dict[str, float]
    route_info: RouteInfo
    destination_weather: Optional[WeatherInfo] = None
    weather_error: Optional[str] = None
    estimated_arrival_time: str


class TravelPlanNewResponse(BaseModel):
    estimated_time: str
    weather_summary: str


class ErrorResponse(BaseModel):
    error: str
    message: str


class TravelPlanRequest(BaseModel):
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    travel_mode: str = "DRIVE"  # DRIVE, WALK, BICYCLE, TRANSIT


def get_coordinates_geocoding(place_name: str) -> Dict[str, Any]:
    """
    Get coordinates using Google Geocoding API
    """
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": place_name,
        "key": GOOGLE_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data["status"] == "OK" and data["results"]:
        result = data["results"][0]
        location = result["geometry"]["location"]

        return {
            "latitude": location["lat"],
            "longitude": location["lng"],
            "formatted_address": result["formatted_address"],
            "place_id": result.get("place_id"),
            "api_used": "Geocoding API"
        }
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Location not found. API Status: {data.get('status', 'Unknown error')}"
        )


def get_coordinates_places(place_name: str) -> Dict[str, Any]:
    """
    Get coordinates using Google Places API Text Search
    """
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": place_name,
        "key": GOOGLE_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data["status"] == "OK" and data["results"]:
        result = data["results"][0]
        location = result["geometry"]["location"]

        return {
            "latitude": location["lat"],
            "longitude": location["lng"],
            "formatted_address": result["formatted_address"],
            "place_id": result["place_id"],
            "api_used": "Places API"
        }
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Location not found. API Status: {data.get('status', 'Unknown error')}"
        )


def get_route_info(source_lat: float, source_lng: float, dest_lat: float, dest_lng: float,
                   travel_mode: str = "DRIVE") -> RouteInfo:
    """
    Get route information using Google Routes API
    """
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.travelAdvisory"
    }

    # Map travel modes to Google Routes API format
    mode_mapping = {
        "DRIVE": "DRIVE",
        "WALK": "WALK",
        "BICYCLE": "BICYCLE",
        "TRANSIT": "TRANSIT"
    }

    payload = {
        "origin": {
            "location": {
                "latLng": {
                    "latitude": source_lat,
                    "longitude": source_lng
                }
            }
        },
        "destination": {
            "location": {
                "latLng": {
                    "latitude": dest_lat,
                    "longitude": dest_lng
                }
            }
        },
        "travelMode": mode_mapping.get(travel_mode.upper(), "DRIVE"),
        "routingPreference": "TRAFFIC_AWARE"
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        data = response.json()
        if "routes" in data and len(data["routes"]) > 0:
            route = data["routes"][0]
            duration_seconds = int(route["duration"].rstrip('s'))
            distance_meters = route["distanceMeters"]

            # Convert duration to readable format
            hours = duration_seconds // 3600
            minutes = (duration_seconds % 3600) // 60
            if hours > 0:
                duration_text = f"{hours}h {minutes}m"
            else:
                duration_text = f"{minutes}m"

            # Convert distance to readable format
            if distance_meters >= 1000:
                distance_text = f"{distance_meters / 1000:.1f} km"
            else:
                distance_text = f"{distance_meters} m"

            return RouteInfo(
                duration_text=duration_text,
                duration_seconds=duration_seconds,
                distance_text=distance_text,
                distance_meters=distance_meters,
                travel_mode=travel_mode.upper()
            )

    # Fallback to Distance Matrix API if Routes API fails
    return get_route_info_fallback(source_lat, source_lng, dest_lat, dest_lng, travel_mode)


def get_route_info_fallback(source_lat: float, source_lng: float, dest_lat: float, dest_lng: float,
                            travel_mode: str) -> RouteInfo:
    """
    Fallback method using Google Distance Matrix API
    """
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"

    # Map travel modes for Distance Matrix API
    mode_mapping = {
        "DRIVE": "driving",
        "WALK": "walking",
        "BICYCLE": "bicycling",
        "TRANSIT": "transit"
    }

    params = {
        "origins": f"{source_lat},{source_lng}",
        "destinations": f"{dest_lat},{dest_lng}",
        "mode": mode_mapping.get(travel_mode.upper(), "driving"),
        "departure_time": "now",
        "traffic_model": "best_guess",
        "key": GOOGLE_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data["status"] == "OK" and data["rows"][0]["elements"][0]["status"] == "OK":
        element = data["rows"][0]["elements"][0]

        return RouteInfo(
            duration_text=element["duration"]["text"],
            duration_seconds=element["duration"]["value"],
            distance_text=element["distance"]["text"],
            distance_meters=element["distance"]["value"],
            travel_mode=travel_mode.upper()
        )
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Route not found. API Status: {data.get('status', 'Unknown error')}"
        )


def get_weather_info(lat: float, lng: float) -> WeatherInfo:
    """
    Get weather information using free weather services with Google location integration
    """
    try:
        # First, get location name using Google Reverse Geocoding
        location_name = get_location_name(lat, lng)

        # Primary method: Use wttr.in for actual weather data
        weather_info = get_weather_from_wttr(lat, lng, location_name)
        if weather_info and weather_info.temperature is not None:
            return weather_info

        # Fallback method: Try alternative free weather service
        weather_info = get_weather_from_open_meteo(lat, lng, location_name)
        if weather_info and weather_info.temperature is not None:
            return weather_info

    except Exception as e:
        pass

    # Final fallback: Return basic weather info
    location_name = get_location_name(lat, lng)
    return WeatherInfo(
        description="Weather information temporarily unavailable - please check local conditions",
        condition="Unknown",
        location_name=location_name,
        data_source="Service unavailable"
    )


def get_weather_from_wttr(lat: float, lng: float, location_name: str) -> Optional[WeatherInfo]:
    """
    Get weather from wttr.in (no API key required)
    """
    try:
        url = f"https://wttr.in/{lat},{lng}?format=j1"
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; TravelPlannerBot/1.0)'
        }

        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            current = data["current_condition"][0]

            return WeatherInfo(
                temperature=float(current["temp_C"]),
                feels_like=float(current["FeelsLikeC"]),
                humidity=int(current["humidity"]),
                description=current["weatherDesc"][0]["value"].lower(),
                condition=current["weatherDesc"][0]["value"],
                wind_speed=float(current["windspeedKmph"]) * 0.277778,  # Convert to m/s
                visibility=float(current["visibility"]) if current["visibility"] != "N/A" else None,
                location_name=location_name,
                data_source="wttr.in weather service"
            )
    except Exception as e:
        print(f"wttr.in error: {e}")

    return None


def get_weather_from_open_meteo(lat: float, lng: float, location_name: str) -> Optional[WeatherInfo]:
    """
    Get weather from Open-Meteo (free, no API key required)
    """
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lng,
            "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility",
            "timezone": "auto"
        }

        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            current = data["current"]

            # Map weather codes to descriptions
            weather_codes = {
                0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
                55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Dense freezing drizzle",
                61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain", 66: "Light freezing rain",
                67: "Heavy freezing rain", 71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
                77: "Snow grains", 80: "Slight rain showers", 81: "Moderate rain showers",
                82: "Violent rain showers", 85: "Slight snow showers", 86: "Heavy snow showers",
                95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
            }

            weather_code = current.get("weather_code", 0)
            condition = weather_codes.get(weather_code, "Unknown")

            return WeatherInfo(
                temperature=current.get("temperature_2m"),
                feels_like=current.get("temperature_2m"),  # Open-Meteo doesn't provide feels_like directly
                humidity=current.get("relative_humidity_2m"),
                description=condition.lower(),
                condition=condition,
                wind_speed=current.get("wind_speed_10m"),
                visibility=current.get("visibility", 0) / 1000 if current.get("visibility") else None,
                # Convert m to km
                location_name=location_name,
                data_source="Open-Meteo weather service"
            )
    except Exception as e:
        print(f"Open-Meteo error: {e}")

    return None


def get_location_name(lat: float, lng: float) -> str:
    """
    Get location name using Google Reverse Geocoding
    """
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "latlng": f"{lat},{lng}",
            "key": GOOGLE_API_KEY
        }

        response = requests.get(url, params=params)
        data = response.json()

        if data["status"] == "OK" and data["results"]:
            # Get the most specific location name
            for component in data["results"][0]["address_components"]:
                if "locality" in component["types"]:
                    return component["long_name"]
            # Fallback to formatted address
            return data["results"][0]["formatted_address"].split(",")[0]
    except:
        pass

    return f"Location({lat}, {lng})"


def get_weather_from_places_api(lat: float, lng: float, location_name: str) -> Optional[WeatherInfo]:
    """
    Try to get weather-related information from Google Places API
    This is a creative approach - searching for weather stations or meteorological services nearby
    """
    try:
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{lat},{lng}",
            "radius": 50000,  # 50km radius
            "keyword": "weather station meteorological",
            "key": GOOGLE_API_KEY
        }

        response = requests.get(url, params=params)
        data = response.json()

        if data["status"] == "OK" and data.get("results"):
            # This would need additional processing to extract actual weather data
            # For now, return a basic response indicating Google Places was used
            return WeatherInfo(
                description="Current weather conditions available via local weather services",
                condition="Variable",
                location_name=location_name,
                data_source="Google Places API"
            )
    except:
        pass

    return None


def get_weather_from_free_api(lat: float, lng: float, location_name: str) -> WeatherInfo:
    """
    Get weather from a free API service (wttr.in - no API key required)
    """
    try:
        # Using wttr.in which provides weather data without API key
        url = f"https://wttr.in/{lat},{lng}?format=j1"
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; WeatherBot/1.0)'
        }

        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            current = data["current_condition"][0]

            return WeatherInfo(
                temperature=float(current["temp_C"]),
                feels_like=float(current["FeelsLikeC"]),
                humidity=int(current["humidity"]),
                description=current["weatherDesc"][0]["value"].lower(),
                condition=current["weatherDesc"][0]["value"],
                wind_speed=float(current["windspeedKmph"]) * 0.277778,  # Convert to m/s
                visibility=float(current["visibility"]) if current["visibility"] != "N/A" else None,
                location_name=location_name,
                data_source="wttr.in (via Google integration)"
            )
    except Exception as e:
        pass

    # Fallback: Return basic weather info
    return WeatherInfo(
        description="Weather data temporarily unavailable",
        condition="Unknown",
        location_name=location_name,
        data_source="Service unavailable"
    )


def generate_weather_summary(weather_info: WeatherInfo, estimated_arrival_time: str) -> str:
    """
    Generate weather summary using Gemini AI
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""
        Based on the following weather information and estimated arrival time, create a 20-word weather summary:

        Location: {weather_info.location_name}
        Estimated Arrival Time: {estimated_arrival_time}
        Temperature: {weather_info.temperature}°C
        Feels Like: {weather_info.feels_like}°C
        Humidity: {weather_info.humidity}%
        Condition: {weather_info.condition}
        Description: {weather_info.description}
        Wind Speed: {weather_info.wind_speed} m/s
        Visibility: {weather_info.visibility} km

        Create a concise 20-word summary focusing on the key weather conditions for the arrival time.
        """

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        # Fallback summary if Gemini fails
        return f"Upon arrival in {weather_info.location_name}: {weather_info.condition}, {weather_info.temperature}°C, humidity {weather_info.humidity}%, visibility {weather_info.visibility}km."


@app.get("/", summary="Health Check")
async def root():
    return {"message": "Location Coordinate Service is running"}


@app.get(
    "/coordinates/geocoding",
    response_model=CoordinateResponse,
    summary="Get coordinates using Geocoding API",
    description="Get latitude and longitude for a place using Google Geocoding API"
)
async def get_coordinates_geocoding_endpoint(
        place_name: str = Query(..., description="Name of the place (e.g., 'Vityiri Resort Wayanad')")
):
    """
    Get coordinates using Google Geocoding API.
    Best for addresses and general place names.
    """
    try:
        result = get_coordinates_geocoding(place_name)
        return CoordinateResponse(
            place_name=place_name,
            **result
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/coordinates/places",
    response_model=CoordinateResponse,
    summary="Get coordinates using Places API",
    description="Get latitude and longitude for a place using Google Places API Text Search"
)
async def get_coordinates_places_endpoint(
        place_name: str = Query(..., description="Name of the place (e.g., 'Vityiri Resort Wayanad')")
):
    """
    Get coordinates using Google Places API Text Search.
    Best for businesses, hotels, and points of interest.
    """
    try:
        result = get_coordinates_places(place_name)
        return CoordinateResponse(
            place_name=place_name,
            **result
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/coordinates/both",
    summary="Get coordinates using both APIs",
    description="Get coordinates from both Geocoding and Places API for comparison"
)
async def get_coordinates_both(
        place_name: str = Query(..., description="Name of the place (e.g., 'Vityiri Resort Wayanad')")
):
    """
    Get coordinates from both APIs for comparison.
    Returns results from both Geocoding API and Places API.
    """
    results = {}

    # Try Geocoding API
    try:
        geocoding_result = get_coordinates_geocoding(place_name)
        results["geocoding"] = CoordinateResponse(
            place_name=place_name,
            **geocoding_result
        )
    except Exception as e:
        results["geocoding"] = {"error": str(e)}

    # Try Places API
    try:
        places_result = get_coordinates_places(place_name)
        results["places"] = CoordinateResponse(
            place_name=place_name,
            **places_result
        )
    except Exception as e:
        results["places"] = {"error": str(e)}

    return results

import pytz


@app.get(
    "/travel-plan",
    response_model=TravelPlanNewResponse,
    summary="Get travel plan with route and weather",
    description="Get route information and destination weather for a journey"
)
async def get_travel_plan(
        source_lat: float = Query(..., description="Source latitude"),
        source_lng: float = Query(..., description="Source longitude"),
        dest_lat: float = Query(..., description="Destination latitude"),
        dest_lng: float = Query(..., description="Destination longitude"),
        travel_mode: str = Query("DRIVE", description="Travel mode: DRIVE, WALK, BICYCLE, TRANSIT")
):
    """
    Get comprehensive travel plan including:
    - Estimated time
    - Weather summary using Gemini AI
    """
    try:
        # Get route information
        route_info = get_route_info(source_lat, source_lng, dest_lat, dest_lng, travel_mode)

        # Get destination weather
        weather_info = get_weather_info(dest_lat, dest_lng)

        # Get current time in IST (regardless of server timezone)
        # Convert server UTC time to IST
        # Get UTC time and add 5:30 hours to convert to IST
        utc_now = datetime.now()
        ist_offset = timedelta(hours=5, minutes=30)
        current_time_ist = utc_now + ist_offset
        arrival_time = current_time_ist + timedelta(seconds=route_info.duration_seconds)
        estimated_arrival_time = arrival_time.strftime("%Y-%m-%d %H:%M:%S IST")

        # Generate weather summary using Gemini AI
        weather_summary = generate_weather_summary(weather_info, estimated_arrival_time)

        return TravelPlanNewResponse(
            estimated_time=estimated_arrival_time,
            weather_summary=weather_summary
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    "/travel-plan",
    response_model=TravelPlanNewResponse,
    summary="Get travel plan (POST method)",
    description="Get route information and destination weather using POST method"
)
async def get_travel_plan_post(request: TravelPlanRequest):
    """
    Get comprehensive travel plan using POST method.
    """
    try:
        # Get route information
        route_info = get_route_info(
            request.source_lat, request.source_lng,
            request.dest_lat, request.dest_lng,
            request.travel_mode
        )

        # Get destination weather
        weather_info = get_weather_info(request.dest_lat, request.dest_lng)

        # Calculate estimated arrival time
        current_time = datetime.now()
        arrival_time = current_time + timedelta(seconds=route_info.duration_seconds)
        estimated_arrival_time = arrival_time.strftime("%Y-%m-%d %H:%M:%S")

        # Generate weather summary using Gemini AI
        weather_summary = generate_weather_summary(weather_info, estimated_arrival_time)

        return TravelPlanNewResponse(
            estimated_time=estimated_arrival_time,
            weather_summary=weather_summary
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# POST endpoint for batch requests
class PlaceRequest(BaseModel):
    place_name: str
    api_type: str = "places"  # "geocoding" or "places"


@app.post(
    "/coordinates",
    response_model=CoordinateResponse,
    summary="Get coordinates (POST method)",
    description="Get coordinates by posting place name in request body"
)
async def get_coordinates_post(request: PlaceRequest):
    """
    Get coordinates using POST method.
    Specify api_type as 'geocoding' or 'places'.
    """
    try:
        if request.api_type.lower() == "geocoding":
            result = get_coordinates_geocoding(request.place_name)
        else:
            result = get_coordinates_places(request.place_name)

        return CoordinateResponse(
            place_name=request.place_name,
            **result
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)