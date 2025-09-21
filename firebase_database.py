"""
Firebase Session Manager
Handles all Firebase operations for session management
"""

import json
import os
from datetime import datetime
from typing import Dict, Optional, Any

try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Firebase Admin SDK not installed. Run: pip install firebase-admin")


class FirebaseSessionManager:
    """Manages session data in Firebase Firestore"""

    def __init__(self, collection_name: str = "user_sessions"):
        self.db = None
        self.collection_name = collection_name
        self.is_initialized = False

        if FIREBASE_AVAILABLE:
            self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK with service account credentials"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                # Option 1: Using service account key file
                service_account_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
                if service_account_path and os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                    print("Firebase initialized with service account file")

                # Option 2: Using service account key JSON string from environment variable
                elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
                    service_account_info = json.loads(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
                    cred = credentials.Certificate(service_account_info)
                    firebase_admin.initialize_app(cred)
                    print("Firebase initialized with service account JSON")

                # Option 3: Using Application Default Credentials (if running on Google Cloud)
                else:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred)
                    print("Firebase initialized with Application Default Credentials")

            self.db = firestore.client()
            self.is_initialized = True
            print("Firebase Firestore client initialized successfully")

        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            self.db = None
            self.is_initialized = False

    def is_available(self) -> bool:
        """Check if Firebase is available and initialized"""
        return FIREBASE_AVAILABLE and self.is_initialized and self.db is not None

    def store_session_data(self, user_id: str, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Store or update session data for a user in Firestore

        Args:
            user_id (str): The user ID
            session_data (dict): Session data returned from Vertex AI

        Returns:
            dict: Result of the operation
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Firebase not available or not initialized",
                "user_id": user_id
            }

        try:
            # Prepare data for Firestore
            firestore_data = {
                'user_id': user_id,
                'session_id': session_data.get('id'),
                'app_name': session_data.get('app_name'),
                'state': session_data.get('state', {}),
                'events': session_data.get('events', []),
                'last_update_time': session_data.get('last_update_time'),
                'vertex_ai_session_data': session_data,  # Store complete session data
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'status': 'active'
            }

            # Use user_id as document ID for easy retrieval and updates
            doc_ref = self.db.collection(self.collection_name).document(user_id)

            # Check if document exists
            doc = doc_ref.get()

            if doc.exists:
                # Update existing document
                # Keep the original created_at timestamp
                existing_data = doc.to_dict()
                firestore_data['created_at'] = existing_data.get('created_at', datetime.utcnow())
                firestore_data['updated_at'] = datetime.utcnow()

                doc_ref.update(firestore_data)
                operation = "updated"
                print(f"Updated session data for user: {user_id}")
            else:
                # Create new document
                doc_ref.set(firestore_data)
                operation = "created"
                print(f"Created new session data for user: {user_id}")

            return {
                "success": True,
                "operation": operation,
                "user_id": user_id,
                "session_id": session_data.get('id'),
                "firestore_document_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Error storing session data: {e}")
            return {
                "success": False,
                "error": str(e),
                "user_id": user_id
            }

    def get_session_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve session data for a user from Firestore

        Args:
            user_id (str): The user ID

        Returns:
            dict: Session data or None if not found
        """
        if not self.is_available():
            print("Firebase not available for retrieving session data")
            return None

        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                return doc.to_dict()
            else:
                return None

        except Exception as e:
            print(f"Error retrieving session data: {e}")
            return None

    def delete_session_data(self, user_id: str) -> Dict[str, Any]:
        """
        Delete session data for a user from Firestore

        Args:
            user_id (str): The user ID

        Returns:
            dict: Result of the operation
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Firebase not available",
                "user_id": user_id
            }

        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc_ref.delete()

            return {
                "success": True,
                "operation": "deleted",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Error deleting session data: {e}")
            return {
                "success": False,
                "error": str(e),
                "user_id": user_id
            }

    def update_session_state(self, user_id: str, new_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update only the state of an existing session

        Args:
            user_id (str): The user ID
            new_state (dict): New state data

        Returns:
            dict: Result of the operation
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Firebase not available",
                "user_id": user_id
            }

        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                doc_ref.update({
                    'state': new_state,
                    'updated_at': datetime.utcnow()
                })

                return {
                    "success": True,
                    "operation": "state_updated",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": "Session not found",
                    "user_id": user_id
                }

        except Exception as e:
            print(f"Error updating session state: {e}")
            return {
                "success": False,
                "error": str(e),
                "user_id": user_id
            }

    def list_all_user_sessions(self, limit: int = 100) -> Dict[str, Any]:
        """
        List all user sessions (for admin purposes)

        Args:
            limit (int): Maximum number of sessions to return

        Returns:
            dict: List of sessions or error
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Firebase not available"
            }

        try:
            docs = self.db.collection(self.collection_name).limit(limit).stream()
            sessions = []

            for doc in docs:
                session_data = doc.to_dict()
                # Remove sensitive data for listing
                session_summary = {
                    'user_id': session_data.get('user_id'),
                    'session_id': session_data.get('session_id'),
                    'created_at': session_data.get('created_at'),
                    'updated_at': session_data.get('updated_at'),
                    'status': session_data.get('status')
                }
                sessions.append(session_summary)

            return {
                "success": True,
                "sessions": sessions,
                "count": len(sessions),
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Error listing sessions: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
_session_manager_instance = None


def get_session_manager(collection_name: str = "user_sessions") -> FirebaseSessionManager:
    """
    Get singleton instance of FirebaseSessionManager

    Args:
        collection_name (str): Firestore collection name

    Returns:
        FirebaseSessionManager: Singleton instance
    """
    global _session_manager_instance

    if _session_manager_instance is None:
        _session_manager_instance = FirebaseSessionManager(collection_name)

    return _session_manager_instance


# Convenience functions
def store_user_session(user_id: str, session_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to store session data"""
    manager = get_session_manager()
    return manager.store_session_data(user_id, session_data)


def get_user_session(user_id: str) -> Optional[Dict[str, Any]]:
    """Convenience function to get session data"""
    manager = get_session_manager()
    return manager.get_session_data(user_id)


def delete_user_session(user_id: str) -> Dict[str, Any]:
    """Convenience function to delete session data"""
    manager = get_session_manager()
    return manager.delete_session_data(user_id)


def is_firebase_available() -> bool:
    """Check if Firebase is available"""
    manager = get_session_manager()
    return manager.is_available()