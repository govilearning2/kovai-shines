import traceback

from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv
import time
import tempfile
from werkzeug.utils import secure_filename
import cv2
import json
from google.adk.sessions import VertexAiSessionService
from google.adk.memory import VertexAiMemoryBankService
from conversation_parser import create_mobile_conversation_response
import asyncio  # Import asyncio
# Load environment variables
from firebase_database import store_user_session, get_user_session, delete_user_session, is_firebase_available

import vertexai
from vertexai import agent_engines
from vertexai.preview.reasoning_engines import AdkApp
import asyncio

from database import db, init_db
from models import User
from flask_cors import CORS, cross_origin # Import CORS and cross_origin
import re


load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for the entire application
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size


# Initialize DB
init_db(app)


# Configure Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'mkv'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


class CameraVideoCapture:
    def __init__(self, capture_duration=6, fps=30):
        self.capture_duration = capture_duration
        self.fps = fps
        self.total_frames = capture_duration * fps
        self.cap = None

    def initialize_camera(self, camera_index=0):
        """Initialize the camera with optimal settings"""
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            raise Exception(f"Could not open camera {camera_index}")

        # Set camera properties
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, self.fps)

        # Get actual camera properties
        actual_fps = self.cap.get(cv2.CAP_PROP_FPS)
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        return width, height, actual_fps

    def capture_video_sequence(self):
        """Capture a video sequence for the specified duration"""
        # Create temporary video file
        temp_video = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        temp_video_path = temp_video.name
        temp_video.close()

        # Get camera properties
        width, height, actual_fps = self.initialize_camera()

        # Setup video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(temp_video_path, fourcc, actual_fps, (width, height))

        frames_captured = 0
        capture_start = time.time()

        try:
            while frames_captured < self.total_frames:
                ret, frame = self.cap.read()
                if not ret:
                    break

                # Write frame to video
                out.write(frame)
                frames_captured += 1

                # Check if duration is complete
                current_time = time.time() - capture_start
                if current_time >= self.capture_duration:
                    break

        finally:
            out.release()
            if self.cap:
                self.cap.release()

        return temp_video_path

    def analyze_video(self, video_path):
        """Analyze the captured video using Gemini API"""
        start_time = time.time()

        try:
            # Upload video to Gemini
            video_file = genai.upload_file(path=video_path)
            upload_time = time.time()

            # Wait for processing
            while video_file.state.name == "PROCESSING":
                time.sleep(0.5)
                video_file = genai.get_file(video_file.name)

            processing_time = time.time()

            # Generate comprehensive analysis
            prompt = """Analyze this video sequence of a crop/plant and provide a comprehensive assessment.
            Look at the entire video to identify:
            1. The type of crop/plant
            2. Any diseases or health issues visible
            3. Symptoms observed throughout the video
            4. Overall plant health assessment
            5. Confidence level based on video quality and visibility

            Respond ONLY with valid JSON in this exact format:
            {
                "crop_name": "name of the crop or 'unknown' if cannot identify",
                "disease": "name of disease or 'healthy' if no disease detected",
                "symptoms": "detailed description of all visible symptoms observed in the video",
                "health_status": "excellent/good/fair/poor based on overall assessment",
                "confidence": "high/medium/low based on video quality and visibility",
                "recommendations": "brief recommendations for care or treatment",
                "video_quality": "assessment of video clarity and usefulness for analysis"
            }"""

            response = model.generate_content([video_file, prompt])
            analysis_time = time.time()

            # Clean up uploaded file
            genai.delete_file(video_file.name)

            # Parse JSON response
            try:
                response_text = response.text.strip()

                # Clean up response text
                if response_text.startswith('```json'):
                    response_text = response_text.split('```json')[1].split('```')[0]
                elif response_text.startswith('```'):
                    response_text = response_text.split('```')[1].split('```')[0]

                result = json.loads(response_text)

                # Add metadata
                result['analysis_metadata'] = {
                    'video_duration': f"{self.capture_duration}s",
                    'total_analysis_time': f"{analysis_time - start_time:.2f}s",
                    'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                    'frames_analyzed': self.total_frames
                }

                return result

            except json.JSONDecodeError as e:
                return {
                    "crop_name": "error",
                    "disease": "parsing_failed",
                    "symptoms": f"Could not parse response: {response.text[:200]}...",
                    "health_status": "unknown",
                    "confidence": "low",
                    "recommendations": "Please retry with better lighting or clearer view",
                    "video_quality": "poor - analysis failed",
                    "error": str(e)
                }

        except Exception as e:
            return {
                "crop_name": "error",
                "disease": "analysis_failed",
                "symptoms": "Analysis failed due to technical error",
                "health_status": "unknown",
                "confidence": "low",
                "recommendations": "Please retry",
                "video_quality": "unknown",
                "error": str(e)
            }


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200


@app.route('/analyze', methods=['POST'])
def analyze_media():
    try:
        # Safely get URL from different sources
        url = None

        # Try to get URL from form data first
        if request.form:
            url = request.form.get('url')

        # If no form data or no URL in form, try JSON (only if content type is JSON)
        if not url and request.is_json:
            json_data = request.get_json()
            if json_data:
                url = json_data.get('url')

        if url and url.strip():  # Use URL if present and not empty
            # Use URL directly with Gemini - no upload needed for public URLs
            start_time = time.time()

            file_reference = {
                "file_data": {
                    "file_uri": url,
                }
            }

            response = model.generate_content([
                file_reference,
                "Your task is to analyze this video/image and tell me the crop name and disease and its symptoms in JSON format { \"crop_name\": \"<crop_name>\", \"disease\": \"<disease_name>\", \"symptoms\": \"<symptoms>\" }"
            ])
            total_time = time.time() - start_time

            return jsonify({
                "analysis": response.text,
                "processing_time": f"{total_time:.2f} seconds",
                "source": "url",
                "source_value": url,
                "status": "success"
            }), 200

        # Fall back to file upload
        if 'file' not in request.files:
            return jsonify({"error": "No file or URL provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed"}), 400

        # Save file temporarily
        filename = secure_filename(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name

        start_time = time.time()

        # mime type
        mime_type = file.content_type if file.content_type else 'application/octet-stream'

        print(f"file name and {file.name} mimie type  {file.content_type}")
        # Upload file to Gemini
        uploaded_file = genai.upload_file(path=temp_path, mime_type=mime_type)
        upload_time = time.time() - start_time

        print(f"File '{uploaded_file.name}' uploaded successfully in {upload_time:.2f} seconds.")

        # Wait for file processing
        process_start = time.time()
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(1)
            uploaded_file = genai.get_file(uploaded_file.name)

        # Generate analysis
        response = model.generate_content([
            uploaded_file,
            "Your task is to analyze this video/image and tell me the crop name and disease and its symptoms in JSON format { \"crop_name\": \"<crop_name>\", \"disease\": \"<disease_name>\", \"symptoms\": \"<symptoms>\" }"
        ])

        total_time = time.time() - start_time

        # Clean up
        os.unlink(temp_path)  # Delete temporary file
        genai.delete_file(uploaded_file.name)  # Delete from Gemini

        return jsonify({
            "analysis": response.text,
            "processing_time": f"{total_time:.2f} seconds",
            "source": "file_upload",
            "source_value": filename,
            "status": "success"
        }), 200

    except Exception as e:
        # Clean up on error
        try:
            if 'temp_path' in locals():
                os.unlink(temp_path)
            if 'uploaded_file' in locals():
                genai.delete_file(uploaded_file.name)
        except:
            pass

        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "status": "failed"}), 500


async def create_vertex_session(project_id, location, app_name, phone_number, initial_state):
    """
    Create a new Vertex AI Session using the actual SDK
    """
    try:
        session_service = VertexAiSessionService(project=project_id, location=location)
        created_session = await session_service.create_session(
            app_name=app_name,
            user_id=phone_number,
            state=initial_state
        )

        return {
            "id": created_session.id,
            "app_name": created_session.app_name,
            "user_id": created_session.user_id,
            "state": created_session.state,
            "events": created_session.events,
            "last_update_time": str(created_session.last_update_time),
            "status": "created"
        }

    except Exception as e:
        raise e


@app.route('/create-session', methods=['POST'])
@cross_origin()
def create_session():
    """
    Creates a new Vertex AI Session.
    Expects JSON payload with 'phone_number' and 'app_name' (Reasoning Engine ID/Name).
    Optional 'state' for initial session state.
    """
    data = request.get_json()
    if not data:
        return jsonify({"status":"false", "error": "Invalid JSON payload"}), 400

    user_id = data.get('user_id')
    PROJECT_ID = data.get('google_project_id')
    LOCATION = data.get('google_project_location')
    REASONING_ENGINE_APP_NAME = data.get('reasoning_engine_app_name')
    # app_name = os.getenv("REASONING_ENGINE_ID")
    initial_state = data.get('state', {"initial_key": "initial_value"})

    if not user_id or not PROJECT_ID or not LOCATION or not REASONING_ENGINE_APP_NAME:
        return jsonify({"status":"false", "error": "Missing 'user_id' or 'REASONING_ENGINE_APP_NAME' or 'PROJECT_ID' or 'LOCATION' in request"}), 400

    try:
        # Run the async function using asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            print(
                f"Creating Vertex AI Session for user_id: {user_id}, app_name: {REASONING_ENGINE_APP_NAME}, initial_state: {initial_state}")
            print(f"Using PROJECT_ID: {PROJECT_ID}, LOCATION: {LOCATION}")
            created_session = loop.run_until_complete(
                create_vertex_session(
                    PROJECT_ID,
                    LOCATION,
                    REASONING_ENGINE_APP_NAME,
                    user_id,
                    initial_state
                )
            )
        finally:
            loop.close()

        if created_session and created_session.get("id"):
            # Modify the return response to include Firebase info
            response_data = {
                "status":"true", 
                "session_id": created_session.get("id")
            }
            return jsonify(response_data), 200
        else:
            return jsonify({"status":"false", "error": "Failed to create Vertex AI Session: No session ID returned"}), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status":"false", "error": f"Failed to create Vertex AI Session: {str(e)}"}), 500
    
@app.route('/query-agent', methods=['POST'])
@cross_origin()
def query_agent():
    # Pass all request data to the async function
    return asyncio.run(async_query_agent())

    

async def async_query_agent():
    """
    Query the Vertex AI Agent Engine with streaming responses.
    Expects JSON payload with 'user_id', 'session_id', and 'query'.
    """
    try:
        
        is_places_response = False
        is_itinery_reponse = False
        places_array = []
        ititernary_array = []
            
            
        data = request.get_json()
        if not data:
            return jsonify({"status":"false", "error": "Invalid JSON payload"}), 400

        user_id = data.get('user_id')
        session_id = data.get('session_id')
        query = data.get('query')
        REASONING_ENGINE_APP_URL = data.get('reasoning_engine_app_url')
        type_of_api_call = data.get('type_of_api_call')
        
        print(f"Type of API call : {type_of_api_call}")

        if not user_id or not session_id or not query or not REASONING_ENGINE_APP_URL:
            return jsonify({
                "status":"false", 
                "error": "Missing required fields: 'user_id', 'session_id', 'query', 'REASONING_ENGINE_APP_URL'"
            }), 400

        # Get the agent engine object
        agent = agent_engines.get(REASONING_ENGINE_APP_URL)

        # Collect streaming responses
        response_accumulator = []
        async for event in agent.async_stream_query(
            user_id=user_id,
            session_id=session_id,
            message=query,
        ):
            
            response_accumulator.append(event)

            # Check for final text responses
            final_text_responses = [
                e for e in response_accumulator
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
                        if type_of_api_call=="places":
                            if "places" in json_data and isinstance(json_data["places"], list):
                                print("Found JSON response with 'places' array. Printing formatted output:")
                                print("Raw text response:")
                                print(raw_text)
                                
                                is_places_response = True
                                places_array = json_data["places"]
                                
                                # Iterate through the places and print key details
                                # for place in json_data["places"]:
                                #     print(f"\n  Place Name: {place.get('place_name')}")
                                #     print(f"  Description: {place.get('place_description')}")
                                #     print(f"  Rating: {place.get('rating')}")
                                #     print(f"  Image URL: {place.get('place_image_url')}")
                                #     print("-" * 20) # Separator for readability
                            else:
                                print("JSON response is not in the expected format.")
                                print(json.dumps(json_data, indent=2))
                        if type_of_api_call=="itineraries":
                            print("Found JSON response with 'Itinerary' array. Printing formatted output:")
                            print("Raw text response:")
                            print(raw_text)
                            is_itinery_reponse=True
                            ititernary_array=json_data
                                    
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

        return jsonify({
            "status": "true",
            "user_id": user_id,
            "session_id": session_id,
            "query": query,
            "raw_parts": response_accumulator,
            "is_places_response":is_places_response,
            "places_array":places_array,
            "is_itinery_reponse":is_itinery_reponse,
            "ititernary_array":ititernary_array
            
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "false",
            "message": "Failed to query agent",
            "error": str(e)
        }), 500


@app.route('/create-update-user', methods=['POST'])
@cross_origin()
def create_update_user():
    """
    Gnerate OTP for the Given Phone no
    """
    data = request.get_json()
    if not data:
        return jsonify({"status":"false", "error": "Invalid JSON payload"}), 400

    user_name = data.get('user_name')
    phone_no = data.get('phone_no')

    if not user_name or not phone_no:
        return jsonify({"status":"false", "error": "Missing 'user_name' or 'phone_no' in request"}), 400

    try:
        user = User.query.filter_by(phone_no=phone_no).first()

        if user:
            # User exists → perform update
            user.name = user_name
            db.session.commit()
            return jsonify({"status":"true", "message": "User already exists. Updated successfully", "user_id": user.id,"user_name":user.name,"user_interests":user.interests,"user_favorites":user.favorites,"user_phone_no":user.phone_no,"otp":"123456"}), 200
        else:
            # User does not exist → create new
            new_user = User(
                name=data.get("user_name"),
                phone_no=phone_no,
            )
            db.session.add(new_user)
            db.session.commit()
            return jsonify({"status":"true", "message": "User created successfully", "user_id": new_user.id,"user_name":new_user.name,"user_interests":new_user.interests,"user_favorites":new_user.favorites,"user_phone_no":new_user.phone_no,"otp":"123456"}), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status":"false", "error": f"Failed to call the Create User API"}), 500


@app.route('/verify-otp', methods=['POST'])
@cross_origin()
def verify_otp():
    """
    Verify the OTP with the User ID
    """
    data = request.get_json()
    if not data:
        return jsonify({"status":"false", "error": "Invalid JSON payload"}), 400

    user_id = data.get('user_id')
    otp = data.get('otp')

    if not user_id or not otp:
        return jsonify({"status":"false", "error": "Missing 'user_id' or 'otp' in request"}), 400

    try:
        
        user = User.query.filter_by(id=user_id).first()
        
        if user:
            # User exists → perform update
            return jsonify({"status":"true", "message": "OTP successfully","user_id": user.id,"user_name":user.name,"user_interests":user.interests,"user_favorites":user.favorites,"user_phone_no":user.phone_no,}), 200
        else:
           
            jsonify({"status":"false", "error": "User not found"}), 400

        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status":"false", "error": f"Failed to call the Create User API"}), 500


@app.route('/update-interests', methods=['POST'])
@cross_origin()
def update_interests():
    """
    To Update User Interest
    """
    data = request.get_json()
    if not data:
        return jsonify({"status":"false", "error": "Invalid JSON payload"}), 400

    user_id = data.get('user_id')
    user_interest = data.get('user_interest')

    if not user_id or not user_interest:
        return jsonify({"status":"false", "error": "Missing 'user_id' or 'user_interest' in request"}), 400

    try:
        user = User.query.filter_by(id=user_id).first()

        if user:
            # User exists → perform update
            user.interests = user_interest
            db.session.commit()
            return jsonify({"status":"true", "message": "User Interest Updated successfully", "user_id": user.id,"user_name":user.name,"user_interests":user.interests,"user_favorites":user.favorites,"user_phone_no":user.phone_no}), 200
        else:
            
            jsonify({"status":"false", "error": "User not found"}), 400
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status":"false", "error": f"Failed to call the Create User API"}), 500


@app.route('/update-favorites', methods=['POST'])
@cross_origin()
def update_favorites():
    """
    To Update User Favorites
    """
    data = request.get_json()
    if not data:
        return jsonify({"status":"false", "error": "Invalid JSON payload"}), 400

    user_id = data.get('user_id')
    user_favorites = data.get('user_favorites')

    if not user_id or not user_favorites:
        return jsonify({"status":"false", "error": "Missing 'user_id' or 'user_favorites' in request"}), 400

    try:
        user = User.query.filter_by(id=user_id).first()

        if user:
            # User exists → perform update
            user.favorites = user_favorites
            db.session.commit()
            return jsonify({"status":"true", "message": "User Favorites Updated successfully", "user_id": user.id,"user_name":user.name,"user_interests":user.interests,"user_favorites":user.favorites,"user_phone_no":user.phone_no}), 200
        else:
            
            jsonify({"status":"false", "error": "User not found"}), 400
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status":"false", "error": f"Failed to call the Create User API"}), 500



async def get_vertex_session(project_id, location, app_name, user_id, session_id):
    """
    Get an existing Vertex AI Session using the actual SDK
    """
    try:
        session_service = VertexAiSessionService(project=project_id, location=location)
        updated_session = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )

        return {
            "id": updated_session.id,
            "app_name": updated_session.app_name,
            "user_id": updated_session.user_id,
            "state": updated_session.state,
            "events": updated_session.events,
            "last_update_time": str(updated_session.last_update_time),
            "status": "retrieved",
            "full_session_details": str(updated_session)
        }

    except Exception as e:
        raise e


@app.route('/get-session/<session_id>', methods=['GET'])
def get_session_by_id(session_id):
    """
    Gets an existing Vertex AI Session by session ID and returns mobile-friendly conversation history.
    Expects query parameters: user_id

    Example: /get-session/1595948274542444544?user_id=9994261899
    """
    user_id = request.args.get('user_id')
    reasoning_engine_id = os.environ.get("REASONING_ENGINE_APP_NAME")

    if not user_id:
        return jsonify({"error": "Missing required query parameter: 'user_id'"}), 400

    if not reasoning_engine_id:
        return jsonify({
            "error": "Missing REASONING_ENGINE_APP_NAME environment variable"
        }), 400

    # Get environment variables for project and location
    PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT_ID")
    LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION")

    if not PROJECT_ID or not LOCATION:
        return jsonify({"error": "Missing GOOGLE_CLOUD_PROJECT_ID or GOOGLE_CLOUD_LOCATION environment variables"}), 500

    def serialize_event(event):
        """Convert Event object to JSON-serializable dictionary"""
        try:
            event_dict = {
                'id': getattr(event, 'id', None),
                'timestamp': getattr(event, 'timestamp', None),
                'author': getattr(event, 'author', None),
                'invocation_id': getattr(event, 'invocation_id', None),
                'content': None,
                'actions': None,
                'error_code': getattr(event, 'error_code', None),
                'error_message': getattr(event, 'error_message', None),
            }

            # Handle content object
            if hasattr(event, 'content') and event.content:
                content_dict = {
                    'role': getattr(event.content, 'role', None),
                    'parts': []
                }

                if hasattr(event.content, 'parts') and event.content.parts:
                    for part in event.content.parts:
                        part_dict = {}
                        if hasattr(part, 'text'):
                            part_dict['text'] = part.text
                        content_dict['parts'].append(part_dict)

                event_dict['content'] = content_dict

            # Handle actions object
            if hasattr(event, 'actions') and event.actions:
                actions_dict = {
                    'state_delta': getattr(event.actions, 'state_delta', {}),
                    'artifact_delta': getattr(event.actions, 'artifact_delta', {}),
                    'skip_summarization': getattr(event.actions, 'skip_summarization', None),
                    'transfer_to_agent': getattr(event.actions, 'transfer_to_agent', None),
                    'escalate': getattr(event.actions, 'escalate', None),
                }
                event_dict['actions'] = actions_dict

            return event_dict
        except Exception as e:
            print(f"Error serializing event: {e}")
            return {'error': f'Failed to serialize event: {str(e)}'}

    def store_recent_activity(user_id, session_id, first_question):
        """Store or update recent activity in Firebase"""
        if not is_firebase_available():
            print("Firebase not available - recent activity not stored")
            return {"success": False, "error": "Firebase not available"}

        try:
            from firebase_admin import firestore
            db = firestore.client()

            # Check if this session already exists for this user
            activities_ref = db.collection('user_recent_activities')
            query = activities_ref.where('user_id', '==', user_id).where('session_id', '==', session_id)
            existing_docs = query.get()

            if existing_docs:
                print(f"Session {session_id} already exists in recent activities for user {user_id}")
                return {"success": True, "operation": "already_exists"}

            # Store new activity
            activity_data = {
                'user_id': user_id,
                'session_id': session_id,
                'first_question': first_question,
                'created_at': firestore.SERVER_TIMESTAMP,
                'accessed_at': firestore.SERVER_TIMESTAMP
            }

            doc_ref = activities_ref.add(activity_data)
            print(f"Recent activity stored with ID: {doc_ref[1].id}")
            return {"success": True, "operation": "created", "doc_id": doc_ref[1].id}

        except Exception as e:
            print(f"Error storing recent activity: {e}")
            return {"success": False, "error": str(e)}

    def extract_first_question(events):
        """Extract the first user question from events"""
        if not events:
            return None

        for event in events:
            # Check if it's a user message
            if (hasattr(event, 'content') and event.content and
                    hasattr(event.content, 'role') and event.author == 'user' and
                    hasattr(event.content, 'parts') and event.content.parts):

                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        return part.text.strip()

        return None

    try:
        # Run the async function using asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            session_details = loop.run_until_complete(
                get_vertex_session(
                    PROJECT_ID,
                    LOCATION,
                    reasoning_engine_id,
                    user_id,
                    session_id
                )
            )
        finally:
            loop.close()

        if session_details and session_details.get("id"):

            # Extract first question before serialization
            first_question = None
            if 'events' in session_details and session_details['events']:
                first_question = extract_first_question(session_details['events'])

            # Serialize the events before processing
            serializable_session = session_details.copy()
            if 'events' in serializable_session and serializable_session['events']:
                serializable_session['events'] = [
                    serialize_event(event) for event in serializable_session['events']
                ]

            # Remove unnecessary data
            if 'full_session_details' in serializable_session:
                del serializable_session['full_session_details']


            # Store recent activity if Firebase is available and we have a first question
            if is_firebase_available() and first_question:
                activity_result = store_recent_activity(user_id, session_id, first_question)
                if activity_result.get("success"):
                    print(f"Recent activity: {activity_result.get('operation')} for session {session_id}")

                    # Update access time if activity already existed
                    if activity_result.get('operation') == 'already_exists':
                        update_activity_access_time(user_id, session_id)
                else:
                    print(f"Recent activity storage failed: {activity_result.get('error')}")
            else:
                print(f"Firebase not available or no first question found, skipping recent activity storage for session {session_id}")
            # Convert to mobile-friendly conversation format
            mobile_response = create_mobile_conversation_response(serializable_session)

            return jsonify(mobile_response), 200

        else:
            return jsonify({
                "status": "error",
                "message": "Session not found",
                "error": "Failed to retrieve Vertex AI Session: Session not found"
            }), 404

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve session",
            "error": f"Failed to retrieve Vertex AI Session: {str(e)}"
        }), 500


def update_activity_access_time(user_id, session_id):
    """
    Updates the accessed_at timestamp for a recent activity.
    Call this when a session is accessed to keep track of recent usage.

    Args:
        user_id (str): The user ID
        session_id (str): The session ID

    Returns:
        dict: Result dictionary with success status and operation details
    """
    if not is_firebase_available():
        return {"success": False, "error": "Firebase not available"}

    try:
        from firebase_admin import firestore
        db = firestore.client()

        # Find the activity document
        activities_ref = db.collection('user_recent_activities')
        query = activities_ref.where('user_id', '==', user_id).where('session_id', '==', session_id)
        docs = query.get()

        if docs:
            # Update the first (and should be only) document
            doc_ref = docs[0].reference
            doc_ref.update({'accessed_at': firestore.SERVER_TIMESTAMP})
            print(f"Updated access time for session {session_id}")
            return {"success": True, "operation": "updated", "doc_id": docs[0].id}
        else:
            print(f"No activity found to update for session {session_id}")
            return {"success": False, "error": "Activity not found"}

    except Exception as e:
        print(f"Error updating activity access time: {e}")
        return {"success": False, "error": str(e)}


# Alternative version with batch update support (if you need to update multiple at once)
def update_multiple_activity_access_times(session_updates):
    """
    Updates the accessed_at timestamp for multiple recent activities in a batch.

    Args:
        session_updates (list): List of dictionaries with 'user_id' and 'session_id' keys
                               Example: [{'user_id': '123', 'session_id': '456'}, ...]

    Returns:
        dict: Result dictionary with success status and operation details
    """
    if not is_firebase_available():
        return {"success": False, "error": "Firebase not available"}

    if not session_updates:
        return {"success": False, "error": "No updates provided"}

    try:
        from firebase_admin import firestore
        db = firestore.client()
        batch = db.batch()

        updated_count = 0
        errors = []

        for update in session_updates:
            user_id = update.get('user_id')
            session_id = update.get('session_id')

            if not user_id or not session_id:
                errors.append(f"Missing user_id or session_id in update: {update}")
                continue

            # Find the activity document
            activities_ref = db.collection('user_recent_activities')
            query = activities_ref.where('user_id', '==', user_id).where('session_id', '==', session_id)
            docs = query.get()

            if docs:
                # Add update to batch
                doc_ref = docs[0].reference
                batch.update(doc_ref, {'accessed_at': firestore.SERVER_TIMESTAMP})
                updated_count += 1
            else:
                errors.append(f"Activity not found for user {user_id}, session {session_id}")

        if updated_count > 0:
            # Commit the batch
            batch.commit()
            print(f"Updated access time for {updated_count} activities")

        return {
            "success": updated_count > 0,
            "operation": "batch_updated",
            "updated_count": updated_count,
            "errors": errors if errors else None
        }

    except Exception as e:
        print(f"Error updating multiple activity access times: {e}")
        return {"success": False, "error": str(e)}


@app.route('/get-recent-activities/<user_id>', methods=['GET'])
def get_recent_activities_by_user(user_id):
    """
    Gets recent activities for a specific user.
    Returns list of recent sessions with session_id and first_question.

    Example: /get-recent-activities/9994261899
    """
    if not is_firebase_available():
        return jsonify({
            "status": "error",
            "message": "Firebase not available",
            "error": "Database service unavailable"
        }), 503

    try:
        from firebase_admin import firestore
        db = firestore.client()

        # Query recent activities for the user using where() method
        activities_ref = db.collection('user_recent_activities')

        # Use where() method (compatible with older SDK versions)
        # First try with ordering - if index exists, this will work
        try:
            query = activities_ref.where('user_id', '==', user_id).order_by('accessed_at',
                                                                            direction=firestore.Query.DESCENDING)
            docs = query.get()
            print(f"Successfully retrieved {len(docs)} activities with server-side ordering for user {user_id}")
        except Exception as index_error:
            if "requires an index" in str(index_error) or "index" in str(index_error).lower():
                print(f"Index required for ordering, falling back to client-side sorting for user {user_id}")
                # Fallback: Get all documents for the user without ordering
                simple_query = activities_ref.where('user_id', '==', user_id)
                docs = simple_query.get()
                print(f"Retrieved {len(docs)} activities without ordering for user {user_id}")

                # Sort documents client-side by accessed_at
                docs_with_timestamps = []
                for doc in docs:
                    data = doc.to_dict()
                    accessed_at = data.get('accessed_at')
                    # Handle different timestamp formats
                    if accessed_at:
                        if hasattr(accessed_at, 'timestamp'):
                            # Firestore timestamp object
                            timestamp_value = accessed_at.timestamp()
                        elif isinstance(accessed_at, (int, float)):
                            # Unix timestamp
                            timestamp_value = accessed_at
                        else:
                            # Fallback - use current time
                            timestamp_value = 0
                    else:
                        timestamp_value = 0

                    docs_with_timestamps.append((doc, timestamp_value))

                # Sort by timestamp (most recent first)
                docs_with_timestamps.sort(key=lambda x: x[1], reverse=True)
                docs = [doc_timestamp[0] for doc_timestamp in docs_with_timestamps]
                print(f"Client-side sorted {len(docs)} activities for user {user_id}")
            else:
                raise index_error

        activities = []
        for doc in docs:
            data = doc.to_dict()

            # Handle timestamp formatting for response
            created_at = data.get('created_at')
            accessed_at = data.get('accessed_at')

            # Format timestamps for JSON serialization
            def format_timestamp(ts):
                if ts:
                    if hasattr(ts, 'timestamp'):
                        return ts.timestamp()
                    elif isinstance(ts, (int, float)):
                        return ts
                return None

            activity = {
                'doc_id': doc.id,
                'session_id': data.get('session_id'),
                'first_question': data.get('first_question'),
                'created_at': format_timestamp(created_at),
                'accessed_at': format_timestamp(accessed_at)
            }
            activities.append(activity)

        print(f"Returning {len(activities)} activities for user {user_id}")
        return jsonify({
            "status": "success",
            "user_id": user_id,
            "activities": activities,
            "count": len(activities)
        }), 200

    except Exception as e:
        print(f"Error getting recent activities for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve recent activities",
            "error": str(e)
        }), 500


# Also fix the store_recent_activity function to ensure it's actually storing data
def store_recent_activity(user_id, session_id, first_question):
    """Store or update recent activity in Firebase"""
    if not is_firebase_available():
        print("Firebase not available - recent activity not stored")
        return {"success": False, "error": "Firebase not available"}

    try:
        from firebase_admin import firestore
        db = firestore.client()

        # Check if this session already exists for this user
        activities_ref = db.collection('user_recent_activities')
        query = activities_ref.where('user_id', '==', user_id).where('session_id', '==', session_id)
        existing_docs = query.get()

        if existing_docs:
            print(f"Session {session_id} already exists in recent activities for user {user_id}")
            # Update the existing document's accessed_at timestamp
            doc_ref = existing_docs[0].reference
            doc_ref.update({'accessed_at': firestore.SERVER_TIMESTAMP})
            return {"success": True, "operation": "updated_existing", "doc_id": existing_docs[0].id}

        # Store new activity
        activity_data = {
            'user_id': user_id,
            'session_id': session_id,
            'first_question': first_question,
            'created_at': firestore.SERVER_TIMESTAMP,
            'accessed_at': firestore.SERVER_TIMESTAMP
        }

        doc_ref = activities_ref.add(activity_data)
        print(f"Recent activity stored with ID: {doc_ref[1].id}")
        return {"success": True, "operation": "created", "doc_id": doc_ref[1].id}

    except Exception as e:
        print(f"Error storing recent activity: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
