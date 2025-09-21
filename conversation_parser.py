"""
Conversation Parser for Mobile App
Converts complex Vertex AI session data to simple conversation history
"""

from datetime import datetime
from typing import List, Dict, Any, Optional


def parse_session_to_conversation(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse Vertex AI session data into simple conversation format for mobile app

    Args:
        session_data: Raw session data from Vertex AI

    Returns:
        Dict containing simplified conversation history
    """

    def extract_message_text(event: Dict[str, Any]) -> str:
        """Extract text message from event content"""
        try:
            if event.get('content') and event['content'].get('parts'):
                parts = event['content']['parts']
                # Combine all text parts
                text_parts = []
                for part in parts:
                    if part.get('text'):
                        text_parts.append(part['text'])
                return ' '.join(text_parts).strip()
            return ""
        except Exception as e:
            print(f"Error extracting message text: {e}")
            return ""

    def format_timestamp(timestamp: float) -> str:
        """Convert timestamp to readable format"""
        try:
            dt = datetime.fromtimestamp(timestamp)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return str(timestamp)

    def determine_sender_type(author: str) -> str:
        """Determine if sender is user or assistant"""
        if author == "user":
            return "user"
        elif author in ["manager", "assistant", "model", "system"]:
            return "assistant"
        else:
            return "system"

    # Extract basic session info
    conversation_data = {
        "session_id": session_data.get('id', ''),
        "user_id": session_data.get('user_id', ''),
        "session_status": session_data.get('status', ''),
        "last_updated": session_data.get('last_update_time', ''),
        "total_messages": 0,
        "conversation": []
    }

    # Parse events into conversation messages
    events = session_data.get('events', [])

    for event in events:
        author = event.get('author', '')
        message_text = extract_message_text(event)

        # Skip empty messages
        if not message_text or message_text.strip() == "":
            continue

        # Create simplified message object
        message = {
            "id": event.get('id', ''),
            "sender": determine_sender_type(author),
            "message": message_text,
            "timestamp": format_timestamp(event.get('timestamp', 0)),
            "raw_timestamp": event.get('timestamp', 0)
        }

        conversation_data["conversation"].append(message)

    # Update total message count
    conversation_data["total_messages"] = len(conversation_data["conversation"])

    # Sort by timestamp to ensure chronological order
    conversation_data["conversation"].sort(key=lambda x: x.get('raw_timestamp', 0))

    # Remove raw_timestamp from final output (keeping only formatted timestamp)
    for msg in conversation_data["conversation"]:
        msg.pop('raw_timestamp', None)

    return conversation_data


def create_mobile_conversation_response(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create mobile-friendly response with conversation history

    Args:
        session_data: Raw session data from Vertex AI

    Returns:
        Mobile-friendly response format
    """

    conversation = parse_session_to_conversation(session_data)

    return {
        "status": "success",
        "message": "Conversation history retrieved successfully",
        "data": {
            "session_info": {
                "session_id": conversation["session_id"],
                "user_id": conversation["user_id"],
                "status": conversation["session_status"],
                "last_updated": conversation["last_updated"],
                "message_count": conversation["total_messages"]
            },
            "conversation_history": conversation["conversation"]
        }
    }


# Example usage function for testing
def test_conversation_parser():
    """Test the conversation parser with sample data"""

    sample_session_data = {
        "id": "8446864489726345216",
        "user_id": "9500502953",
        "status": "retrieved",
        "last_update_time": "1753561258.510319",
        "events": [
            {
                "id": "2322044587926880256",
                "author": "user",
                "timestamp": 1753561170.798229,
                "content": {
                    "parts": [{
                                  "text": "I am facing issues with Banana in kathili like small cut across one or two in every banan tree. can you help."}]
                }
            },
            {
                "id": "8473961678914977792",
                "author": "manager",
                "timestamp": 1753561171.116261,
                "content": {
                    "parts": [{
                                  "text": "Okay, I understand. I'm ready to handle requests from farmers and delegate them to the appropriate agents based on the instructions. Just let me know what the farmer is asking!"}]
                }
            },
            {
                "id": "124287969770078208",
                "author": "user",
                "timestamp": 1753561256.807233,
                "content": {
                    "parts": [{"text": "can you tell me the price of tomato on 1st August 2025"}]
                }
            },
            {
                "id": "5744780304728457216",
                "author": "manager",
                "timestamp": 1753561257.244765,
                "content": {
                    "parts": [{
                                  "text": "Okay, I'm ready for the next farmer request. I'll keep an eye on the instructions and my memory to make sure I handle everything correctly."}]
                }
            }
        ]
    }

    result = create_mobile_conversation_response(sample_session_data)
    print("Sample mobile response:")
    import json
    print(json.dumps(result, indent=2))

    return result


if __name__ == "__main__":
    test_conversation_parser()