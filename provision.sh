#!/bin/bash
usage() { echo "Usage: $0 [-p <project id>] [-r <region>] [-f <folder id> -b <billing id>]" 1>&2; exit 1; }
projectid() { PROJECT_ID=$(gcloud projects list --filter ${PROJECT} --format text | grep projectId | sed 's/[^ ]* *//'); }
REGION=us-west-1 #default
if [ -z $PROJECT ]; then PROJECT=open-pls; fi #default
while getopts "f:b:p:r:" option; do
    case "${option}" in
	r) REGION=${OPTARG};;
	f) FOLDER_ID=${OPTARG};;
	b) BILLING_ID=${OPTARG};;
	p) PROJECT=${OPTARG};;
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
    gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:terraform@${PROJECT}.iam.gserviceaccount.com --role roles/editor
    gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:terraform@${PROJECT}.iam.gserviceaccount.com --role roles/storage.admin
    echo "Created project id $PROJECT"
fi
projectid

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
terraform apply -var folder_id="${FOLDER_ID}" -var project="${PROJECT}" -var project_id="${PROJECT_ID}" -var region="${REGION}" terraform
