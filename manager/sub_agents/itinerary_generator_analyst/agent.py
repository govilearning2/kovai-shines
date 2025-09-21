import os
import requests
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from datetime import datetime, timedelta
from typing import List
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
 
 
def custom_search_tool(query: str) -> str:
    """
    Performs a Google Custom Search to find recent information like prices, names, and fees.
 
    Args:
        query: The search query, e.g., 'budget resorts in Ooty' or 'Doddabetta Peak entry fee'.
 
    Returns:
        A formatted string of the top search results.
    """
    api_key = os.environ.get("CUSTOM_SEARCH_API_KEY")
    search_engine_id = os.environ.get("CUSTOM_SEARCH_ENGINE_ID")
    if not api_key or not search_engine_id:
        return "Error: API Key or Search Engine ID not found."
    
    url = "https://www.googleapis.com/customsearch/v1"
    params = {'key': api_key, 'cx': search_engine_id, 'q': query}
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        results = response.json().get('items', [])
        if not results:
            return "No information found online."
        
        snippets = [f"Title: {item.get('title')}\nSummary: {item.get('snippet', '').replace('...', '')}" for item in results[:3]]
        return "\n---\n".join(snippets)
    except requests.exceptions.RequestException as e:
        return f"Error: The search request failed. {e}"
 
# --- Agent Definition ---
itinerary_generator_analyst = Agent(
    name="itinerary_generator_analyst",
    model="gemini-2.5-flash",
    description="Generate a detailed day-wise trip itinerary with suggestions for hotels, restaurants, entry fees, and individual images for attractions.",
    # Agent Instruction
 
instruction="""
    You are a master trip planning agent. Your goal is to convert a JSON list of places into a rich, detailed, day-by-day itinerary. The input you receive will contain pre-fetched details for each place, including its name, image URL, latitude, longitude, and address.
 
    -   **Use the input data directly** for place images and location details. Do not call tools to find this information again.
    -   Use the `custom_search_tool` **only** to find information that is **NOT** in the input, such as names/prices for hotels, restaurants, and attraction entry fees.
    -   **Crucially, all suggestions for accommodation and food must align with the overall trip `budget`.**
 
    Follow these steps meticulously:
    1.  **Create Itinerary Structure:** From the input `places` list, create a logical `days` array with a schedule for each day.
 
    2.  **Enhance Each Schedule Event:** Iterate through each event in the `schedule` you created and build a comprehensive object for it. For each event:
        -   **For Tourist Attractions (e.g., "Visit Baga Beach"):**
            -   Find the matching place in the input JSON.
            -   Copy the `place_image_url` to a new key named `event_image_url`.
            -   Create a new `location` object and copy the `latitude`, `longitude`, and `address` from the input data into it.
            -   Call `custom_search_tool` to find its entry fee. If found, set `is_entry_fee` to `true` and populate `entry_fee_price`.
        -   **For Hotel Events (e.g., "Check into hotel"):**
            -   Set `is_hotel` to `true`.
            -   Use `custom_search_tool` to find 3-5 budget-friendly hotel/resort names and prices. Add these to a `suggested_accommodations` list.
        -   **For Meal Events (e.g., "Breakfast", "Lunch", "Dinner"):**
            -   Set a new boolean flag `is_restaurant` to `true`.
            -   Use `custom_search_tool` to find 3-5 suitable restaurant names and price ranges. Add these to a `suggested_restaurants` list.
        -   **Set Defaults:** For any event, if a specific flag or data is not applicable, set it to `false`, `null`, or an empty list `[]` as appropriate.
 
    3.  **Format the Final JSON:** Assemble all the enhanced information into a single, clean JSON object. Ensure every schedule item has the new keys (`event_image_url`, `location`, `is_restaurant`, etc.), setting them to default values if not applicable.
      """,
    tools=[
        FunctionTool(get_place_details),
        FunctionTool(get_knowledge_graph_info),
        FunctionTool(custom_image_search),
        FunctionTool(custom_search_tool),
    ],
)