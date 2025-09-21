# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
 
"""Deployment script for Image Scoring."""
 
import os
 
from absl import app
from absl import flags
from dotenv import load_dotenv
load_dotenv()
import asyncio
from google.genai import types

from manager.agent import root_agent

import vertexai
from vertexai import agent_engines
from vertexai.preview.reasoning_engines import AdkApp
import json
import re

FLAGS = flags.FLAGS
flags.DEFINE_string("project_id", None, "GCP project ID.")
flags.DEFINE_string("location", None, "GCP location.")
flags.DEFINE_string("bucket", None, "GCP bucket.")
flags.DEFINE_string("resource_id", None, "ReasoningEngine resource ID.")
 
flags.DEFINE_bool("list", False, "List all agents.")
flags.DEFINE_bool("stream_query", False, "Stream Query Reasoning engine.")
flags.DEFINE_bool("query", False, "Query Reasoning engine.")
flags.DEFINE_bool("create", False, "Creates a new agent.")
flags.DEFINE_bool("delete", False, "Deletes an existing agent.")
flags.mark_bool_flags_as_mutual_exclusive(["create", "delete"])
 
# Calculate the path to the directory that CONTAINS your 'Multi_Agent' folder.
# This assumes your deploy.py is inside "Multi_Agent/deployment/".
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
 
def create() -> None:
    """Creates an agent engine for Image Scoring."""
    adk_app = AdkApp(agent=root_agent, enable_tracing=True)
    
    load_dotenv()
    
    env_vars_to_deploy = {
        "GOOGLE_PLACES_API_KEY": os.getenv("GOOGLE_PLACES_API_KEY"),
        "CUSTOM_SEARCH_API_KEY": os.getenv("CUSTOM_SEARCH_API_KEY"),
        "CUSTOM_SEARCH_ENGINE_ID": os.getenv("CUSTOM_SEARCH_ENGINE_ID"),
        # Add any other required variables here
    }
    
    print(f"Env : {env_vars_to_deploy}")
 
    remote_agent = agent_engines.create(
        adk_app,
        display_name="travel-advisor",
        description="A multi-agent system for helping trip planner",
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]"
        ],
        extra_packages=["manager"],
        env_vars=env_vars_to_deploy  # <-- This is the key change
    )
    print(f"Created remote agent: {remote_agent.resource_name}")
 
 
def delete(resource_id: str) -> None:
    remote_agent = agent_engines.get(resource_id)
    remote_agent.delete(force=True)
    print(f"Deleted remote agent: {resource_id}")
 
 
async def list_agents() -> None:
    remote_agents = agent_engines.list()
    template = """
{agent.name} ("{agent.display_name}")
- Create time: {agent.create_time}
- Update time: {agent.update_time}
"""
    remote_agents_string = "\n".join(
        template.format(agent=agent) for agent in remote_agents
    )
    print(f"All remote agents:\n{remote_agents_string}")

  
        
async def stream_query_agent() -> None:
#     remote_agents = agent_engines.list()
#     template = """
# {agent.name} ("{agent.display_name}")
# - Create time: {agent.create_time}
# - Update time: {agent.update_time}
# """
#     remote_agents_string = "\n".join(
#         template.format(agent=agent) for agent in remote_agents
#     )
#     print(f"All remote agents:\n{remote_agents_string}")

    image_part = types.Part.from_uri(
        file_uri="gs://kovai-shines-genai/assets/images.jpeg",
        mime_type="image/jpeg",
    )
    text_part = types.Part.from_text(
        text="What is in this image?",
    )
    transcript_to_summarize = """
    Trip Destination: Munnar, Kerala; Travel Dates: Sep 21, 2025 - Sep 26, 2025; Budget: Mid-range; Trip Type: Family; Interests: History,Relaxation; Number of Travelers: 1 Adults, 0 Children; Mode of Travel: Car; Please suggest places to visit based on these confirmed details. Proceed directly to place_analyst agent and suggestions without asking for confirmation or any message proceed with displaying the placess list array as response    
    """
    agent = agent_engines.get("projects/1081352890794/locations/us-central1/reasoningEngines/1475232343173103616")

    # for response in agent.stream_query(
    #     user_id="9626186859",
    #     session_id="8678545883349909504",
    #     message=transcript_to_summarize
    # ):
    async for response in agent.async_stream_query(
        user_id="9626186859",
        session_id="9024707328145883136",
        message=transcript_to_summarize
    ):
        
        print(response)
        
async def query_agent() -> None:

    image_part = types.Part.from_uri(
        file_uri="gs://kovai-shines-genai/assets/images.jpeg",
        mime_type="image/jpeg",
    )
    text_part = types.Part.from_text(
        text="What is in this image?",
    )
    transcript_to_summarize = """
    Trip Destination: Munnar, Kerala; Travel Dates: Sep 21, 2025 - Sep 26, 2025; Budget: Mid-range; Trip Type: Family; Interests: History,Relaxation; Number of Travelers: 1 Adults, 0 Children; Mode of Travel: Car; Please suggest places to visit based on these confirmed details. Proceed directly to place_analyst agent and suggestions without asking for confirmation or any message proceed with displaying the placess list array as response    
    """
    agent = agent_engines.get("projects/1081352890794/locations/us-central1/reasoningEngines/1475232343173103616")

    events = []
    async for response in agent.async_stream_query(
        user_id="9626186859",
        session_id="7774958431550570496",
        message=transcript_to_summarize
    ):
        
        print(response) 
        
        events.append(response)
            
        # The full event stream shows the agent's thought process
        # print("--- Full Event Stream ---")
        # for event in events:
        #     print(event)

        # Check for final text responses
        final_text_responses = [
            e for e in events
            if e.get("content", {}).get("parts", [{}])[0].get("text")
            and not e.get("content", {}).get("parts", [{}])[0].get("function_call")
        ]
        
        if final_text_responses:
            print("\n--- Final Response ---")
            
            # Extract the raw text from the first final response
            raw_text = final_text_responses[0]["content"]["parts"][0]["text"]
            
            # Check if the response is a JSON code block
            if raw_text.strip().startswith('```json') and raw_text.strip().endswith('```'):
                try:
                    json_string = raw_text.strip()[7:-3].strip()

                    # This is the new, more robust pre-processing step
                    # It replaces any invalid escape sequence with a simple space.
                    # This regex looks for a backslash followed by any character that is not a valid JSON escape character.
                    cleaned_json_string = re.sub(r'\\(?!["\\/bfnrtu])', '', json_string)
                    
                    json_data = json.loads(cleaned_json_string)
                    
                    # Check if the JSON has a 'places' key
                    if "places" in json_data and isinstance(json_data["places"], list):
                        print("Found JSON response with 'places' array. Printing formatted output:")
                        
                        # Iterate through the places and print key details
                        for place in json_data["places"]:
                            print(f"\n  Place Name: {place.get('place_name')}")
                            print(f"  Description: {place.get('place_description')}")
                            print(f"  Rating: {place.get('rating')}")
                            print(f"  Image URL: {place.get('place_image_url')}")
                            print("-" * 20) # Separator for readability
                    else:
                        print("JSON response is not in the expected format.")
                        print(json.dumps(json_data, indent=2))
                except json.JSONDecodeError as e:
                    print(f"Failed to decode JSON. Error: {e}")
                    print("Raw text response:")
                    print(raw_text)
            else:
                # If not a JSON code block, print the raw text as is
                print("Response is plain text. Printing raw content:")
                print(raw_text)
            
            # You can break here if you only want the final response
            break                   
 
 
def main(argv: list[str]) -> None:
 
    # print all load environment variables
    for key, value in os.environ.items():
        print(f"{key}: {value}")
 
    project_id = (
        FLAGS.project_id if FLAGS.project_id else os.getenv("GOOGLE_CLOUD_PROJECT")
    )
    location = FLAGS.location if FLAGS.location else os.getenv("GOOGLE_CLOUD_LOCATION")
    bucket = FLAGS.bucket if FLAGS.bucket else os.getenv("GOOGLE_CLOUD_STORAGE_BUCKET")
 
    print(f"PROJECT: {project_id}")
    print(f"LOCATION: {location}")
    print(f"BUCKET: {bucket}")
 
    if not project_id:
        print("Missing required environment variable: GOOGLE_CLOUD_PROJECT")
        return
    elif not location:
        print("Missing required environment variable: GOOGLE_CLOUD_LOCATION")
        return
    elif not bucket:
        print("Missing required environment variable: GOOGLE_CLOUD_STORAGE_BUCKET")
        return
 
    vertexai.init(
        project=project_id,
        location=location,
        staging_bucket=f"gs://{bucket}",
    )
 
    if FLAGS.list:
        list_agents()
    elif FLAGS.stream_query:
        asyncio.run(stream_query_agent())  
    elif FLAGS.query:
        asyncio.run(query_agent())   
    elif FLAGS.create:
        create()
    elif FLAGS.delete:
        if not FLAGS.resource_id:
            print("resource_id is required for delete")
            return
        delete(FLAGS.resource_id)
    else:
        print("Unknown command")
 
 
if __name__ == "__main__":
    app.run(main)