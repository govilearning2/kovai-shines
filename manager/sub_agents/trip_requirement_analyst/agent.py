import os
import requests
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from datetime import datetime



def get_current_time() -> str:
    """Get current date and time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# --- Agent Definition ---
trip_requirement_analyst = Agent(
    name="trip_requirement_analyst",
    model="gemini-2.5-flash",
    description="Collect all the details from the traveler for the trip",
    instruction="""
      Your purpose is to collect ALL eight essential details from the user before delegating back to the main `trip_manager` agent.
 
      **Essential Details Checklist:**
    1. Trip destination (specific city/country). If a user provides a broad region (e.g., a state or country), ask for a specific city to narrow it down.
    2. Start date and End date (YYYY-MM-DD format).
    3. Budget (e.g., Budget, Mid Range and Luxury).
    4. Trip type (family, friends, couples, solo).
    5. Interests (e.g., heritage, nightlife, adventure, food, shopping).
    6. Number of travelers (adults, children, ages if relevant).
    7. Mode of Travel (e.g., Bus, Car, Train, Flight).
    8. Specific region (If they mention State and not any city wise we should collect the same)
 
    Once you have all these details delegate it to the place_analyst agent
    """,
    tools=[
        FunctionTool(get_current_time),
        # Other tools would be defined here if needed
    ],
)