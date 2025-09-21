import functions_framework
import googlemaps
import os
import json
from datetime import datetime, timedelta


@functions_framework.http
def get_traffic_duration(request):
    try:
        # Initialize Google Maps client
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not api_key:
            return json.dumps({'error': 'API key not found'}), 500

        gmaps = googlemaps.Client(key=api_key)

        request_json = request.get_json(silent=True)
        if not request_json or 'calls' not in request_json:
            return json.dumps({'error': 'Invalid request format'}), 400

        results = []
        for call in request_json['calls']:
            if len(call) < 4:
                results.append([])
                continue

            source_lat, source_lon, dest_lat, dest_lon = call[:4]

            # Get traffic data for next 5 hours (every 15 minutes = 20 data points)
            current_time = datetime.now()
            time_series_data = []

            for i in range(20):  # 20 intervals of 15 minutes = 5 hours
                departure_time = current_time + timedelta(minutes=i * 15)

                try:
                    # Use the Directions API with specific departure time
                    directions_result = gmaps.directions(
                        (source_lat, source_lon),
                        (dest_lat, dest_lon),
                        mode="driving",
                        departure_time=departure_time
                    )

                    duration_seconds = None
                    if directions_result and len(directions_result) > 0 and 'legs' in directions_result[0]:
                        leg = directions_result[0]['legs'][0]
                        if 'duration_in_traffic' in leg:
                            duration_seconds = leg['duration_in_traffic']['value']
                        elif 'duration' in leg:
                            duration_seconds = leg['duration']['value']

                    # Create data point for this time slot
                    data_point = [
                        departure_time.isoformat(),  # departure_time
                        source_lat,  # source_lat
                        source_lon,  # source_lon
                        dest_lat,  # dest_lat
                        dest_lon,  # dest_lon
                        duration_seconds  # duration_in_traffic_seconds
                    ]

                    time_series_data.append(data_point)

                except Exception as e:
                    # Add null data point for failed requests
                    data_point = [
                        departure_time.isoformat(),
                        source_lat,
                        source_lon,
                        dest_lat,
                        dest_lon,
                        None
                    ]
                    time_series_data.append(data_point)

            # Add the complete time_series_data as ONE result for this call
            results.append(time_series_data)

        # The return format for BigQuery Remote Function must be 'replies'
        # Convert the nested array to a JSON string to avoid BigQuery parsing issues
        replies_with_json_strings = []
        for result in results:
            # Convert each result to a JSON string
            json_string = json.dumps(result)
            replies_with_json_strings.append(json_string)

        return json.dumps({'replies': replies_with_json_strings})

    except Exception as e:
        # Handle any errors and return a meaningful response
        return json.dumps({'replies': ['[]'], 'error': str(e)}), 500