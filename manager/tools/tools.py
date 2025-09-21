import os
import requests
from datetime import datetime, timedelta


def get_current_time() -> str:
    """Get current date and time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def get_place_location(place_name: str) -> dict:
    """
    Fetch latitude, longitude, and formatted address of a place using Google Places API.
    
    Args:
        place_name: The name of the place to search for.
    
    Returns:
        A dictionary containing the place's details.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "Google API Key not found in environment variables."}

    try:
        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {"query": place_name, "key": api_key}
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if data.get("status") != "OK" or not data.get("results"):
            return {"error": f"No results found for {place_name}."}

        place = data["results"][0]
        location = place.get("geometry", {}).get("location", {})

        return {
            "name": place.get("name", "Unknown"),
            "address": place.get("formatted_address", "Address not available"),
            "latitude": location.get("lat"),
            "longitude": location.get("lng"),
            "rating": place.get("rating", 0),
            "user_rating_count": place.get("user_ratings_total", 0),
            "place_id": place.get("place_id"),
            "types": place.get("types", [])
        }
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {str(e)}"}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}


def get_place_knowledge_info(place_name: str, destination: str = "") -> dict:
    """
    Get place information and image URL using Google Knowledge Graph API.
    
    Args:
        place_name: Name of the place
        destination: Destination city/country for context
        
    Returns:
        Dictionary with place info, description, and image URL
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "Google API Key not found."}
    
    try:
        # Try searching with destination context first, then just place name
        search_queries = [
            f"{place_name} {destination}",
            place_name
        ]
        
        for query in search_queries:
            url = "https://kgsearch.googleapis.com/v1/entities:search"
            params = {
                "query": query,
                "key": api_key,
                "limit": 3,
                "indent": True
            }
            
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                
                if data.get("itemListElement"):
                    for item in data["itemListElement"]:
                        result = item.get("result", {})
                        
                        # Check if this is a relevant place/location
                        types = result.get("@type", [])
                        if any(t in ["Place", "City", "TouristAttraction", "LandmarksOrHistoricalBuildings", 
                                   "Museum", "Park"] for t in types):
                            
                            # Extract image information
                            image_info = result.get("image", {})
                            image_url = (
                                image_info.get("contentUrl") or 
                                image_info.get("url") or 
                                f"https://via.placeholder.com/400x300?text={place_name.replace(' ', '+')}"
                            )
                            
                            # Extract detailed description
                            detailed_desc = result.get("detailedDescription", {})
                            description = (
                                detailed_desc.get("articleBody", "")[:200] + "..." 
                                if len(detailed_desc.get("articleBody", "")) > 200
                                else detailed_desc.get("articleBody", result.get("description", "A notable destination worth visiting."))
                            )
                            
                            return {
                                "name": result.get("name", place_name),
                                "description": description,
                                "image_url": image_url,
                                "knowledge_id": result.get("@id", ""),
                                "types": types,
                                "wikipedia_url": detailed_desc.get("url", ""),
                                "source": "Google Knowledge Graph"
                            }
                
    except Exception as e:
        print(f"Error with Knowledge Graph API: {str(e)}")
    
    # Fallback if Knowledge Graph doesn't return results
    return {
        "name": place_name,
        "description": f"Popular destination in {destination}" if destination else "A wonderful place to visit",
        "image_url": f"https://via.placeholder.com/400x300?text={place_name.replace(' ', '+')}",
        "knowledge_id": "",
        "types": ["Place"],
        "wikipedia_url": "",
        "source": "Fallback"
    }


def get_place_image_url(place_name: str, destination: str) -> str:
    """
    Get image URL for a place using Knowledge Graph API.
    
    Args:
        place_name: Name of the place
        destination: Destination city/country
        
    Returns:
        Image URL
    """
    knowledge_info = get_place_knowledge_info(place_name, destination)
    return knowledge_info.get("image_url", f"https://via.placeholder.com/400x300?text={place_name.replace(' ', '+')}")


def get_place_details(place_id: str, place_name: str = "", destination: str = "") -> dict:
    """
    Get detailed information about a place including photos from Google Places API
    and enhanced info from Knowledge Graph API.
    
    Args:
        place_id: Google Place ID
        place_name: Name of the place (for Knowledge Graph lookup)
        destination: Destination context
        
    Returns:
        Detailed place information
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "Google API Key not found."}
    
    # Start with Knowledge Graph data
    knowledge_info = get_place_knowledge_info(place_name, destination)
    
    # Enhance with Google Places API data if place_id is available
    places_data = {}
    if place_id:
        try:
            url = "https://maps.googleapis.com/maps/api/place/details/json"
            params = {
                "place_id": place_id,
                "fields": "name,formatted_address,rating,user_ratings_total,price_level,opening_hours,photos,types,editorial_summary,website",
                "key": api_key
            }
            
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                result = data.get("result", {})
                
                # Get Google Places photo if available, otherwise use Knowledge Graph image
                photo_url = knowledge_info.get("image_url")
                photos = result.get("photos", [])
                if photos and not knowledge_info.get("image_url", "").startswith("https://via.placeholder"):
                    photo_reference = photos[0].get("photo_reference")
                    if photo_reference:
                        google_photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference={photo_reference}&key={api_key}"
                        # Prefer Knowledge Graph image, but provide Google Photos as backup
                        photo_url = knowledge_info.get("image_url", google_photo_url)
                
                places_data = {
                    "opening_hours": result.get("opening_hours", {}).get("weekday_text", []),
                    "price_level": result.get("price_level", 2),
                    "website": result.get("website", ""),
                    "google_photo_url": f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference={photos[0].get('photo_reference')}&key={api_key}" if photos else "",
                    "editorial_summary": result.get("editorial_summary", {}).get("overview", "")
                }
        except Exception as e:
            print(f"Error getting Places API details: {str(e)}")
    
    # Combine Knowledge Graph and Places API data
    final_description = (
        knowledge_info.get("description", "") or 
        places_data.get("editorial_summary", "") or 
        f"A popular destination in {destination}"
    )
    
    return {
        "description": final_description,
        "image_url": knowledge_info.get("image_url", f"https://via.placeholder.com/400x300?text={place_name.replace(' ', '+')}"),
        "opening_hours": places_data.get("opening_hours", []),
        "price_level": places_data.get("price_level", 2),
        "website": places_data.get("website", ""),
        "wikipedia_url": knowledge_info.get("wikipedia_url", ""),
        "knowledge_types": knowledge_info.get("types", []),
        "source_info": {
            "knowledge_graph": knowledge_info.get("source", ""),
            "google_places": "Available" if places_data else "Not available"
        }
    }


def search_places_by_interest(destination: str, interests: list, trip_type: str, budget_level: str = "medium") -> dict:
    """
    Search for places based on user interests and return JSON formatted response with Knowledge Graph images.
    
    Args:
        destination: The travel destination
        interests: List of user interests (heritage, nightlife, adventure, etc.)
        trip_type: Type of trip (family, friends, couples, solo)
        budget_level: Budget level (low, medium, high)
    
    Returns:
        JSON formatted dictionary with categorized places including Knowledge Graph images
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "Google API Key not found."}

    # Map interests to search queries
    interest_mapping = {
        "heritage": ["museums", "historical sites", "monuments", "cultural centers"],
        "nightlife": ["bars", "clubs", "night markets", "entertainment"],
        "adventure": ["outdoor activities", "hiking", "adventure sports", "nature"],
        "food": ["restaurants", "local cuisine", "food markets", "cafes"],
        "shopping": ["shopping malls", "markets", "boutiques", "local shops"],
        "nature": ["parks", "gardens", "beaches", "scenic spots"],
        "religious": ["temples", "churches", "religious sites", "spiritual places"]
    }

    # Budget to price level mapping
    budget_mapping = {
        "low": [0, 1, 2],
        "medium": [1, 2, 3],
        "high": [2, 3, 4]
    }

    try:
        response_data = {
            "status": "success",
            "destination": destination,
            "trip_type": trip_type,
            "budget_level": budget_level,
            "total_categories": 0,
            "total_places": 0,
            "categories": {}
        }
        
        for interest in interests:
            if interest.lower() not in interest_mapping:
                continue
                
            places_in_category = []
            search_terms = interest_mapping[interest.lower()]
            
            for term in search_terms:
                query = f"{term} in {destination}"
                url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
                params = {"query": query, "key": api_key}
                
                api_response = requests.get(url, params=params)
                if api_response.status_code == 200:
                    data = api_response.json()
                    
                    for place in data.get("results", [])[:2]:  # Limit to top 2 per term
                        location = place.get("geometry", {}).get("location", {})
                        price_level = place.get("price_level", 2)
                        place_name = place.get("name", "Unknown Place")
                        
                        # Filter by budget
                        if price_level not in budget_mapping.get(budget_level, [1, 2, 3]):
                            continue
                        
                        # Get Knowledge Graph information for better images and descriptions
                        knowledge_info = get_place_knowledge_info(place_name, destination)
                        
                        # Get additional place details from Places API
                        place_details = get_place_details(
                            place.get("place_id", ""), 
                            place_name, 
                            destination
                        )
                        
                        # Use Knowledge Graph description if available, otherwise Places API
                        description = (
                            knowledge_info.get("description", "") or 
                            place_details.get("description", "") or
                            f"Popular {interest} destination in {destination}"
                        )
                        
                        place_info = {
                            "place_id": place.get("place_id"),
                            "name": place_name,
                            "description": description,
                            "address": place.get("formatted_address", "Address not available"),
                            "rating": round(place.get("rating", 0), 1),
                            "user_ratings_total": place.get("user_ratings_total", 0),
                            "price_level": price_level,
                            "latitude": location.get("lat"),
                            "longitude": location.get("lng"),
                            "image": {
                                "url": knowledge_info.get("image_url", f"https://via.placeholder.com/400x300?text={place_name.replace(' ', '+')}"),
                                "source": knowledge_info.get("source", "Placeholder")
                            },
                            "types": place.get("types", []),
                            "opening_hours": place_details.get("opening_hours", []),
                            "website": place_details.get("website", ""),
                            "wikipedia_url": knowledge_info.get("wikipedia_url", ""),
                            "budget_friendly": price_level <= 2,
                            "highly_rated": place.get("rating", 0) >= 4.0,
                            "knowledge_graph_id": knowledge_info.get("knowledge_id", ""),
                            "knowledge_types": knowledge_info.get("types", [])
                        }
                        
                        places_in_category.append(place_info)
            
            # Remove duplicates based on place_id
            unique_places = []
            seen_ids = set()
            for place in places_in_category:
                place_identifier = place["place_id"] or place["name"]
                if place_identifier not in seen_ids:
                    unique_places.append(place)
                    seen_ids.add(place_identifier)
            
            # Sort by rating and limit to top 8
            unique_places.sort(key=lambda x: (x["rating"], x["user_ratings_total"]), reverse=True)
            top_places = unique_places[:8]
            
            if top_places:
                response_data["categories"][interest.title()] = {
                    "category_name": interest.title(),
                    "places_count": len(top_places),
                    "places": top_places
                }
                response_data["total_places"] += len(top_places)
        
        response_data["total_categories"] = len(response_data["categories"])
        
        return response_data
        
    except Exception as e:
        return {"status": "error", "message": f"Error searching places: {str(e)}"}


def build_itinerary(selected_places: list, start_date: str, end_date: str, trip_details: dict) -> dict:
    """
    Generate a day-wise itinerary with detailed information.
    
    Args:
        selected_places: List of selected place names
        start_date: Trip start date (YYYY-MM-DD)
        end_date: Trip end date (YYYY-MM-DD)
        trip_details: Dictionary with trip information
    
    Returns:
        Detailed day-wise itinerary
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        total_days = (end - start).days + 1
        
        if total_days <= 0:
            return {"error": "Invalid date range"}
        
        # Get detailed information for each selected place
        detailed_places = []
        for place_name in selected_places:
            place_info = get_place_location(place_name)
            if "error" not in place_info:
                detailed_places.append(place_info)
        
        if not detailed_places:
            return {"error": "No valid places found"}
        
        # Distribute places across days
        places_per_day = max(1, len(detailed_places) // total_days)
        
        itinerary = {
            "trip_summary": {
                "destination": trip_details.get("destination", "Unknown"),
                "start_date": start_date,
                "end_date": end_date,
                "total_days": total_days,
                "trip_type": trip_details.get("trip_type", "Unknown"),
                "members": trip_details.get("members", "Unknown"),
                "budget": trip_details.get("budget", "Unknown"),
                "interests": trip_details.get("interests", [])
            },
            "daily_itinerary": []
        }
        
        # Time slots for scheduling
        time_slots = [
            {"time": "09:00 AM", "period": "Morning", "duration": "2-3 hours"},
            {"time": "01:00 PM", "period": "Afternoon", "duration": "2-3 hours"},
            {"time": "05:00 PM", "period": "Evening", "duration": "2-3 hours"},
            {"time": "07:30 PM", "period": "Dinner/Night", "duration": "2 hours"}
        ]
        
        place_index = 0
        
        for day_num in range(total_days):
            current_date = start + timedelta(days=day_num)
            day_places = []
            
            # Assign places to this day
            places_today = min(places_per_day, len(detailed_places) - place_index)
            if day_num == total_days - 1:  # Last day - assign remaining places
                places_today = len(detailed_places) - place_index
            
            for i in range(places_today):
                if place_index < len(detailed_places):
                    place = detailed_places[place_index]
                    time_slot = time_slots[i % len(time_slots)]
                    
                    day_places.append({
                        "place_name": place["name"],
                        "address": place["address"],
                        "latitude": place["latitude"],
                        "longitude": place["longitude"],
                        "rating": place["rating"],
                        "user_rating_count": place["user_rating_count"],
                        "scheduled_time": time_slot["time"],
                        "period": time_slot["period"],
                        "suggested_duration": time_slot["duration"],
                        "place_id": place.get("place_id"),
                        "what_to_explore": generate_exploration_suggestions(place["name"], place.get("types", []))
                    })
                    place_index += 1
            
            itinerary["daily_itinerary"].append({
                "day": day_num + 1,
                "date": current_date.strftime("%Y-%m-%d"),
                "day_name": current_date.strftime("%A"),
                "places": day_places,
                "total_places": len(day_places)
            })
        
        return itinerary
        
    except ValueError as e:
        return {"error": f"Invalid date format: {str(e)}"}
    except Exception as e:
        return {"error": f"Error building itinerary: {str(e)}"}


def generate_exploration_suggestions(place_name: str, place_types: list) -> list:
    """Generate suggestions for what to explore at a place based on its types"""
    suggestions = []
    
    type_suggestions = {
        "museum": ["Explore historical artifacts", "Take guided tours", "Visit special exhibitions"],
        "park": ["Enjoy nature walks", "Have a picnic", "Take photographs", "Relax and unwind"],
        "restaurant": ["Try local cuisine", "Experience authentic flavors", "Meet locals"],
        "tourist_attraction": ["Take photos", "Learn about history", "Enjoy the views"],
        "shopping_mall": ["Shop for souvenirs", "Try local brands", "Enjoy food court"],
        "place_of_worship": ["Appreciate architecture", "Learn about local culture", "Experience spiritual atmosphere"],
        "amusement_park": ["Enjoy thrilling rides", "Have family fun", "Try local snacks"],
        "zoo": ["See exotic animals", "Educational experience", "Family entertainment"],
        "aquarium": ["Explore marine life", "Educational shows", "Interactive exhibits"]
    }
    
    for place_type in place_types:
        if place_type in type_suggestions:
            suggestions.extend(type_suggestions[place_type])
    
    # Default suggestions if no specific type matches
    if not suggestions:
        suggestions = ["Explore the area", "Take photos", "Experience local culture", "Learn about the place"]
    
    return list(set(suggestions))  # Remove duplicates