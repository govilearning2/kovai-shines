# agri-saarathi
To deploy the Backend code to Cloud RUN
*****************************************8
chmod +rx deploy.sh
./deploy.sh



DB creation in GCP
******************************
Ref : https://codelabs.developers.google.com/travel-agent-mcp-toolbox-adk?hl=en#2
1. To Create DB instance in the GCP - Run the below command in GCLOUD CLI
gcloud sql instances create trip-planner-emt \
--database-version=POSTGRES_15 \
--tier db-g1-small \
--region=us-central1 \
--edition=ENTERPRISE \
--root-password=postgres

2. To Create DB & User
Open  Google cloud account > Cloud SQL > click the instance created from the previous step
Navigate to Cloud SQL studio to create DB
select prostgress from the DB dropdown and USer as progres and same for password


To connect Cloud RUN & Cloud SQL
1. Go to cloud run the specific instance - edit the connection and slect the cloud sql connect and save deploy
2. Go to cloud sql > edit network > allow all ip