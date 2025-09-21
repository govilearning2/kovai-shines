gcloud functions deploy get_traffic_duration ^
  --runtime python311 ^
  --trigger-http ^
  --allow-unauthenticated ^
  --set-env-vars GOOGLE_MAPS_API_KEY=<api-key> ^
  --timeout 540s ^
  --memory 512MB ^