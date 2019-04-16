#!/bin/bash
usage() { echo "Usage: $0 [-p <project id>] [-f <folder id> -b <billing id> -o <oauth_client_id>]" 1>&2; exit 1; }
projectid() { PROJECT_ID=$(gcloud projects list --filter ${PROJECT} --format text | grep projectId | sed 's/[^ ]* *//'); }
if [ -z $PROJECT ]; then PROJECT=openpls-demo; fi #default
while getopts "f:b:p:r:o:" option; do
    case "${option}" in
	f) FOLDER_ID=${OPTARG};;
	b) BILLING_ID=${OPTARG};;
	p) PROJECT=${OPTARG};;
	o) OAUTH_CLIENT_ID=${OPTARG};;
    esac
done

# Check if project exists and create it if not
projectid
if [ -z $PROJECT_ID ]; then
    if [ -z $FOLDER_ID ] || [ -z $BILLING_ID ]; then echo "You must supply organization_id and billing_id if the project doesn't exist"; usage; fi
    echo "Creating project..."
    gcloud projects create $PROJECT --folder $FOLDER_ID --set-as-default # to scope the following iam calls
    gcloud beta billing projects link $PROJECT --billing-account $BILLING_ID
    gcloud iam service-accounts create terraform --display-name "Terraform admin account"
    gcloud iam service-accounts keys create credentials.json --iam-account terraform@${PROJECT}.iam.gserviceaccount.com
    gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:terraform@${PROJECT}.iam.gserviceaccount.com --role roles/owner
    gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:terraform@${PROJECT}.iam.gserviceaccount.com --role roles/storage.admin
    gcloud services enable serviceusage.googleapis.com
    echo "Created project id $PROJECT"
fi
projectid

# Check if we have oauth credentials
if [ ! -f oauth_credentials ]; then
    if [ -z $OAUTH_CLIENT_ID ]; then echo "You must supply an oauth_client_id created using https://console.cloud.google.com/apis/credentials which whitelists storage.googleapis.com"; usage; fi
    echo "OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}" > oauth_credentials
else
    source oauth_credentials
fi


# Check if bucket for config exists and create it if not
BUCKET=${PROJECT_ID}-terraform-config
BUCKET_EXISTS=$(gsutil ls -p ${PROJECT_ID} gs://${BUCKET})
if [ -z $BUCKET_EXISTS ]; then
    echo "Creating bucket for config..."
    gsutil mb -p $PROJECT_ID gs://${BUCKET}
    terraform init -backend-config="bucket=${BUCKET}" -backend-config="prefix=terraform/state" -backend-config="project=${PROJECT_ID}" -backend-config="credentials=credentials.json" terraform
fi
export GOOGLE_PROJECT=$PROJECT_ID
if [ ! -f credentials.json ]; then echo "Your credentials could not be found. Please place them in the file credentials.json."; exit 1; fi
export GOOGLE_APPLICATION_CREDENTIALS=credentials.json
terraform init -backend-config="bucket=${BUCKET}" -backend-config="prefix=terraform/state" -backend-config="project=${PROJECT_ID}" -backend-config="credentials=credentials.json" terraform
terraform apply -var project="${PROJECT}" -var oauth_client_id="${OAUTH_CLIENT_ID}" terraform
WEB_FRONTEND=$(terraform output web_frontend)
gsutil cp -r website/** $WEB_FRONTEND
LIST_FUNCTION=$(terraform output function_list_projects)
echo "To visit OpenPLS, navigate to https://storage.googleapis.com/${WEB_FRONTEND/gs:\/\//}/index.html"
echo $LIST_FUNCTION
