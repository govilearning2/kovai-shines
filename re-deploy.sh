#!/bin/bash

# Configuration - Update these values
PROJECT_ID=""
SERVICE_NAME=""
REGION=""
GEMINI_API_KEY=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting redeployment to GCP Cloud Run...${NC}"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set the project (silent)
gcloud config set project $PROJECT_ID --quiet

# Get current service info
echo -e "${YELLOW}📋 Checking current service status...${NC}"
CURRENT_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' 2>/dev/null)

if [ -z "$CURRENT_URL" ]; then
    echo -e "${RED}❌ Service $SERVICE_NAME not found. Run deploy.sh first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found existing service at: $CURRENT_URL${NC}"

# Build and submit the container image (with faster caching)
echo -e "${YELLOW}🏗️  Rebuilding container image...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --quiet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please check your code and try again.${NC}"
    exit 1
fi

# Redeploy to Cloud Run (faster - only updates the image)
echo -e "${YELLOW}🚀 Redeploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --quiet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed. Please check the logs.${NC}"
    exit 1
fi

# Get the updated service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Redeployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo ""

# Quick health check
echo -e "${YELLOW}🩺 Performing health check...${NC}"
sleep 3  # Give service a moment to start

HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response "${SERVICE_URL}/health")
HTTP_CODE=${HEALTH_RESPONSE: -3}

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    HEALTH_DATA=$(cat /tmp/health_response)
    echo -e "${BLUE}Response: ${HEALTH_DATA}${NC}"
else
    echo -e "${YELLOW}⚠️  Health check returned HTTP $HTTP_CODE${NC}"
    echo -e "${YELLOW}Service might still be starting up...${NC}"
fi

# Clean up temp file
rm -f /tmp/health_response

echo ""
echo -e "${BLUE}🎉 Redeployment complete! Your API is ready to use.${NC}"
echo ""
echo -e "${YELLOW}📋 Quick Test Commands:${NC}"
echo -e "  • Health Check: ${BLUE}curl -X GET ${SERVICE_URL}/health${NC}"
echo -e "  • Analyze Image: ${BLUE}curl -X POST -F 'file=@image.jpg' ${SERVICE_URL}/analyze${NC}"
