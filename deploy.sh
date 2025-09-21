#!/bin/bash

# Configuration - Update these values
PROJECT_ID="kovai-shines-472309"
SERVICE_NAME="emt-with-db"
REGION="us-central1"
GEMINI_API_KEY="AIzaSyBv9QkNESRTIU1g49w0fkgOZb8UEuS_Ojo"
REASONING_ENGINE_APP_NAME="2901202167375331328"
REASONING_ENGINE_APP_URL="projects/kovai-shines-472309/locations/us-central1/reasoningEngines/2901202167375331328"
REASONING_ENGINE_ID="2901202167375331328"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="postgres"
DB_HOST="34.10.201.208"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting deployment to GCP Cloud Run...${NC}"

# ================================
# Step 1: Generate .env file
# ================================
cat > .env <<EOL
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY="AIzaSyBv9QkNESRTIU1g49w0fkgOZb8UEuS_Ojo"
GOOGLE_APPLICATION_CREDENTIALS=kovai-shines-472309-f936f974b4b8.json
GOOGLE_CLOUD_PROJECT=kovai-shines-472309
GOOGLE_MAPS_API_KEY="AIzaSyBk2bh6RYNIT43RYLMZ54YrC-ryhvvxd3A"
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_STORAGE_BUCKET=kovai-shines-genai
CUSTOM_SEARCH_API_KEY="AIzaSyBk2bh6RYNIT43RYLMZ54YrC-ryhvvxd3A"
CUSTOM_SEARCH_ENGINE_ID="c2b4794826d844660"
REASONING_ENGINE_ID="2901202167375331328"
REASONING_ENGINE_APP_NAME="2901202167375331328"
REASONING_ENGINE_APP_URL="projects/kovai-shines-472309/locations/us-central1/reasoningEngines/2901202167375331328"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="postgres"
DB_HOST="34.10.201.208"
DB_PORT="5432"
EOL

echo -e "${GREEN}✅ .env file generated successfully.${NC}"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📋 Setting GCP project to ${PROJECT_ID}...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Build and submit the container image
echo -e "${YELLOW}🏗️  Building container image...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --memory 2Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY \
  --set-env-vars REASONING_ENGINE_APP_URL=$REASONING_ENGINE_APP_URL \
  --set-env-vars REASONING_ENGINE_APP_NAME=$REASONING_ENGINE_APP_NAME \
  --set-env-vars REASONING_ENGINE_ID=$REASONING_ENGINE_ID \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --set-env-vars DB_USER=$DB_USER \
  --set-env-vars DB_PASSWORD=$DB_PASSWORD \
  --set-env-vars DB_NAME=$DB_NAME \
  --set-env-vars DB_HOST=$DB_HOST \
  --set-env-vars DB_PORT=$DB_PORT

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}📋 API Endpoints:${NC}"
echo -e "  • Health Check: ${SERVICE_URL}/health"
echo -e "  • Analysis: ${SERVICE_URL}/analyze (POST with file upload)"
echo ""
echo -e "${YELLOW}🧪 Test your deployment:${NC}"
echo -e "curl -X GET ${SERVICE_URL}/health"
echo ""
echo -e "${YELLOW}📝 To upload a file for analysis:${NC}"
echo -e "curl -X POST -F 'file=@your-image.jpg' ${SERVICE_URL}/analyze"
