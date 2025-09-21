from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from dotenv import load_dotenv
import os

db = SQLAlchemy()
load_dotenv()

def init_db(app: Flask):
    """
    Initialize the SQLAlchemy connection with the Flask app
    """
    # Replace these values with your Cloud SQL settings
    DB_USER = os.environ.get("DB_USER")
    DB_PASSWORD = os.environ.get("DB_PASSWORD")
    DB_NAME = os.environ.get("DB_NAME")
    DB_HOST = os.environ.get("DB_HOST")
    DB_PORT = os.environ.get("DB_PORT", "5432")

    # Connection URI for PostgreSQL (Cloud SQL)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    # Check the database connection after initialization
    check_db_connection(app)
    
def check_db_connection(app):
    """
    Attempts to connect to the database and prints the result.
    """
    with app.app_context():
        try:
            # Perform a simple query to test the connection
            with db.engine.connect() as connection:
                print("Database connection successful!")
                # You can run a simple query if you want, like checking the current time
                result = connection.execute(db.text("SELECT NOW()")).scalar()
                print(f"Current database time: {result}")
        except Exception as e:
            print(f"Error: Database connection failed!")
            print(f"Reason: {e}")
            import traceback
            traceback.print_exc()    
