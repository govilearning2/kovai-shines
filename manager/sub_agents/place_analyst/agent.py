import os
import requests
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from datetime import datetime
from typing import Dict, Any
 
def get_place_details(place_name: str) -> Dict[str, Any]:
    """
    Searches for a place using the Google Places API (Text Search) to get
    reliable details like description and rating.
 
    Args:
        place_name: The name of the place to search for, e.g., 'Ooty Botanical Gardens'.
 
    Returns:
        A dictionary containing the  rating, and review count.
    """
    try:
        # NOTE: The Places API uses a different API key than Custom Search.
        # Make sure you have the "Places API" enabled in your Google Cloud project.
        api_key = os.environ["GOOGLE_PLACES_API_KEY"]
    except KeyError:
        return {"error": "GOOGLE_PLACES_API_KEY not found in environment variables."}
 
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": place_name,
        "key": api_key
    }
 
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
 
        if not data.get("results"):
            return {"error": f"No results found for {place_name}."}
 
        # Use the first result
        first_place = data["results"][0]
        
        rating = first_place.get("rating")
        review_count = first_place.get("user_ratings_total")
 
        rating_info = "Not available"
        if rating:
            rating_info = f"{rating}/5"
            if review_count:
                rating_info += f" (from {review_count} reviews)"
 
        return {
      
            "rating": rating_info,
            
        }
        
    except requests.exceptions.RequestException as e:
        return {"error": f"The Places API request failed: {e}"}
 
def get_knowledge_graph_info(query: str) -> Dict[str, Any]:
    """
    Performs a Google Custom Search to find a description, rating, and image for a tourist place.
 
    Note: Ratings and images are extracted from the search result's rich snippets (if available)
    and may not always be present or as accurate as dedicated APIs like the Google Places API.
 
    Args:
        query: The name of the tourist place to search for, e.g., 'Ooty Botanical Gardens'.
 
    Returns:
        A dictionary containing the place's description, rating, and a representative image URL.
    """
    try:
        # Fetch API credentials from environment variables
        api_key = 'AIzaSyBk2bh6RYNIT43RYLMZ54YrC-ryhvvxd3A'
        search_engine_id = 'c2b4794826d844660'
    except KeyError:
        return {"error": "API Key or Search Engine ID not found in environment variables."}
 
    # API endpoint and parameters
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': api_key,
        'cx': search_engine_id,
        'q': query
    }
 
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raises an exception for HTTP errors (4xx or 5xx)
        data = response.json()
        results = data.get('items', [])
 
        # Return a default structure if no results are found
        if not results:
            return {
                "description": f"No information found online for '{query}'.",
                "rating": None,
                "image_url": None
            }
 
        # Use the first result as the most relevant one
        first_result = results[0]
        
        # --- 1. Extract Description ---
        # The 'snippet' usually contains a good summary.
        description = first_result.get('snippet', 'No description available.').replace('\n', ' ')
 
        # --- 2. Extract Image URL ---
        # The 'pagemap' object often contains rich data like a thumbnail image.
        image_url = None
        pagemap = first_result.get('pagemap', {})
        cse_image = pagemap.get('cse_image', [])
        if cse_image:
            image_url = cse_image[0].get('src')
 
        # --- 3. Extract Rating ---
        # Attempt to find rating information within the 'pagemap'.
        rating_info = None
        aggregaterating = pagemap.get('aggregaterating', [])
        if aggregaterating:
            rating_value = aggregaterating[0].get('ratingvalue')
            review_count = aggregaterating[0].get('reviewcount')
            if rating_value:
                rating_info = f"{rating_value}/5"
                if review_count:
                    rating_info += f" (from {review_count} reviews)"
 
        return {
            "description": description,
        }
        
    except requests.exceptions.RequestException as e:
        return {"error": f"The search request failed: {e}"}
def custom_image_search(query: str) -> dict:
    """
    Searches for an image using a custom API and returns the first image URL.
    
    Args:
        query: The search query, e.g., 'Eiffel Tower'.
 
    Returns:
        A dictionary with the image URL.
    """
    api_key = os.environ.get("CUSTOM_SEARCH_API_KEY")
    cse_id = os.environ.get("CUSTOM_SEARCH_ENGINE_ID")
    if not api_key or not cse_id:
        return {"error": "API Key or CSE ID not found."}
 
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "q": query,
            "cx": cse_id,
            "searchType": "image",
            "key": api_key
        }
        response = requests.get(url, params=params)
        data = response.json()
        
        if not data.get("items"):
            return {"error": f"No images found for {query}."}
 
        first_image = data["items"][0]
        return {"image_url": first_image.get("link")}
    
    except Exception as e:
        return {"error": f"An error occurred with the Custom Search API: {e}"}
def get_coordinates(location_name: str) -> Dict[str, Any]:
    """
    Finds the latitude and longitude for a given location name using the Google Geocoding API.
 
    Args:
        location_name: The name of the location to search for (e.g., "Eiffel Tower", "Ooty").
 
    Returns:
        A dictionary containing the latitude, longitude, and formatted address,
        or an error message if the location cannot be found.
    """
    # IMPORTANT: Replace this placeholder with your actual Google Maps API key.
    # For better security, it is recommended to store this key as an environment variable.
    api_key = "AIzaSyBk2bh6RYNIT43RYLMZ54YrC-ryhvvxd3A"
 
    if not api_key or "YOUR_GOOGLE_MAPS_API_KEY" in api_key:
        return {"error": "Google Maps API key is not set. Please replace the placeholder."}
 
    # API endpoint and parameters
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        'address': location_name,
        'key': api_key
    }
 
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
        data = response.json()
 
        # Check if the API returned a successful status
        if data['status'] == 'OK':
            # Extract the relevant information from the first result
            result = data['results'][0]
            location = result['geometry']['location']
            lat = location['lat']
            lng = location['lng']
            formatted_address = result.get('formatted_address', 'No address found')
 
            return {
                "latitude": lat,
                "longitude": lng,
                "formatted_address": formatted_address
            }
        else:
            # Handle API-specific errors like "ZERO_RESULTS" or "REQUEST_DENIED"
            return {"error": f"Geocoding API error: {data['status']}. {data.get('error_message', '')}"}
 
    except requests.exceptions.RequestException as e:
        # Handle network-related errors
        return {"error": f"The geocoding request failed: {e}"}
 
# --- Agent Definition ---
place_analyst = Agent(
    name="place_analyst",
    model="gemini-2.5-flash",
    description="provide end-to-end places tailored to a traveler's budget and details",
    instruction="""
When a user asks for travel recommendations, immediately start calling tools to gather data. Do not provide any response until you have called all required tools.
 
PROCESS:
1. Identify 2 places based on user's request
2. For each place, call these 3 tools in order:
   - get_knowledge_graph_info("place name")
   - get_place_details("place name")
   - custom_image_search("place name")
   - get_coordinates("place name")
3. After all tool calls complete, return only this JSON:
 
{
  "places": [
    {
      "place_name": "name",
      "place_description": "description from knowledge graph",
      "place_image_url": "image url from tools",
      "rating": rating_number_from_places_api,
      "user_rating_count": count_from_places_api
      ""latitude": Take from get coordinates
        "longitude": Take from get coordinates
        "address": Take from get coordinates
    }
  ]
}
 
RULES:
- Call tools for ALL 2 places before responding
- Use tool results, never your own knowledge
- If tool fails, use null for that field
- Return ONLY the JSON, no other text
- Image priority: knowledge graph first, then custom search
    """,
    tools=[
        FunctionTool(get_place_details),
        FunctionTool(get_knowledge_graph_info),
        FunctionTool(custom_image_search),
        FunctionTool(get_coordinates),
       
    ],
)