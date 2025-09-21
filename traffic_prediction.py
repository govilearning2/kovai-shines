from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google.cloud import bigquery
import json
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Traffic Prediction API", version="1.0.0")

# Initialize BigQuery client
# Method 1: Using environment variable
try:
    client = bigquery.Client()
except Exception as e:
    # Method 2: Using service account key file
    service_account_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if service_account_path and os.path.exists(service_account_path):
        client = bigquery.Client.from_service_account_json(service_account_path)
    else:
        # Method 3: Specify project explicitly
        project_id = "kovai-shines-472309"  # Replace with your project ID
        client = bigquery.Client(project=project_id)


class TrafficRequest(BaseModel):
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float


class TrafficPrediction(BaseModel):
    departure_time: str
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    duration_seconds: int
    duration_minutes: float


class TrafficResponse(BaseModel):
    best_time: TrafficPrediction
    time_saved_minutes: float
    total_predictions_analyzed: int


@app.post("/predict-traffic", response_model=TrafficResponse)
async def predict_traffic(request: TrafficRequest):
    try:
        # Use the original working query that returns all predictions
        query = f"""
        WITH function_result AS (
          SELECT `kovai-shines-472309.traffic_transaction_data.get_traffic_data`(
            {request.source_lat}, {request.source_lng}, {request.dest_lat}, {request.dest_lng}
          ) as json_string_result
        ),
        parsed_data AS (
          SELECT JSON_EXTRACT_ARRAY(PARSE_JSON(json_string_result)) as data_array
          FROM function_result
        ),
        traffic_data AS (
          SELECT 
            TIMESTAMP(JSON_EXTRACT_SCALAR(record, '$[0]')) as departure_time,
            CAST(JSON_EXTRACT_SCALAR(record, '$[1]') AS FLOAT64) as source_lat,
            CAST(JSON_EXTRACT_SCALAR(record, '$[2]') AS FLOAT64) as source_lng,
            CAST(JSON_EXTRACT_SCALAR(record, '$[3]') AS FLOAT64) as dest_lat,
            CAST(JSON_EXTRACT_SCALAR(record, '$[4]') AS FLOAT64) as dest_lng,
            CAST(JSON_EXTRACT_SCALAR(record, '$[5]') AS INT64) as duration_seconds,
            ROUND(CAST(JSON_EXTRACT_SCALAR(record, '$[5]') AS FLOAT64) / 60.0, 2) as duration_minutes
          FROM parsed_data,
          UNNEST(data_array) as record
          WHERE JSON_EXTRACT_SCALAR(record, '$[5]') IS NOT NULL
        )
        SELECT 
          departure_time,
          source_lat,
          source_lng,
          dest_lat,
          dest_lng,
          duration_seconds,
          duration_minutes
        FROM traffic_data
        ORDER BY departure_time
        """

        # Execute the query
        query_job = client.query(query)
        results = query_job.result()

        # Process all results and find the best one
        all_predictions = []
        for row in results:
            prediction = TrafficPrediction(
                departure_time=row.departure_time.isoformat(),
                source_lat=row.source_lat,
                source_lng=row.source_lng,
                dest_lat=row.dest_lat,
                dest_lng=row.dest_lng,
                duration_seconds=row.duration_seconds,
                duration_minutes=row.duration_minutes
            )
            all_predictions.append(prediction)

        if not all_predictions:
            raise HTTPException(status_code=404, detail="No traffic predictions found")

        # Find the best time (minimum duration)
        best_time = min(all_predictions, key=lambda x: x.duration_seconds)
        worst_time = max(all_predictions, key=lambda x: x.duration_seconds)

        # Calculate time saved
        time_saved = round((worst_time.duration_seconds - best_time.duration_seconds) / 60.0, 2)

        return TrafficResponse(
            best_time=best_time,
            time_saved_minutes=time_saved,
            total_predictions_analyzed=len(all_predictions)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting traffic predictions: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Traffic Prediction API"}


@app.get("/")
async def root():
    return {
        "message": "Traffic Prediction API",
        "description": "Get the best time to travel between two locations",
        "endpoints": {
            "POST /predict-traffic": "Get the optimal travel time for a route",
            "GET /health": "Health check"
        },
        "example_request": {
            "source_lat": 11.0176,
            "source_lng": 76.9674,
            "dest_lat": 11.4102,
            "dest_lng": 76.6950
        },
        "example_response": {
            "best_time": {
                "departure_time": "2025-09-21T05:56:21.898007+00:00",
                "duration_minutes": 173.3
            },
            "time_saved_minutes": 5.18,
            "total_predictions_analyzed": 20
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)