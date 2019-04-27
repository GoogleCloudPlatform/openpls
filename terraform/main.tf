variable "project" {}
variable "oauth_client_id" {}

variable "region" {
 default = "us-central1"
}

provider "google" {
 credentials = "${file("credentials.json")}"
 project     = "${var.project}"
 region      = "${var.region}"
}

terraform {
 backend "gcs" {}
}

resource "google_project_services" "apis" {
  project    = "${var.project}"
  services   = ["serviceusage.googleapis.com", "storage-component.googleapis.com", "storage-api.googleapis.com",
  "cloudfunctions.googleapis.com", "pubsub.googleapis.com", "logging.googleapis.com", "iam.googleapis.com",
  "iamcredentials.googleapis.com", "cloudresourcemanager.googleapis.com"]
}

resource "google_storage_bucket" "web_bucket" {
  name = "openpls-web-bucket"
  location = "US"
  project = "${var.project}"
  website {
    main_page_suffix = "index.html"
  }
}

resource "google_storage_default_object_access_control" "public_rule" {
  bucket = "${google_storage_bucket.web_bucket.name}"
  role   = "READER"
  entity = "allUsers"
}

resource "google_storage_bucket" "data_bucket" {
  name = "openpls-data-bucket"
  location = "US"
  project = "${var.project}"
}

resource "google_service_account" "functions" {
  account_id   = "cloud-functions"
  display_name = "Cloud functions service account"
}

resource "null_resource" "delay" {
  provisioner "local-exec" {
    command = "sleep 5"
  }
  triggers = {
    "before" = "${google_service_account.functions.id}"
  }
}

resource "google_project_iam_binding" "token_creator" {
  project = "${var.project}"
  role    = "roles/iam.serviceAccountTokenCreator"
  members = [
    "serviceAccount:${google_service_account.functions.email}"
  ]
}

module "project" {
  source = "modules/function"
  source_dir = "src/project"
  name = "project"
  bucket = "${google_storage_bucket.data_bucket.name}"
  service_account_email = "${google_service_account.functions.email}"
  project = "${var.project}"
  region = "${var.region}"
  environment_variables = {
    DATA_BUCKET = "${google_storage_bucket.data_bucket.name}"
    OAUTH_CLIENT_ID = "${var.oauth_client_id}"
  }
}

module "list_projects" {
  source = "modules/function"
  source_dir = "src/list_projects"
  name = "list-projects"
  bucket = "${google_storage_bucket.data_bucket.name}"
  service_account_email = "${google_service_account.functions.email}"
  project = "${var.project}"
  region = "${var.region}"
  environment_variables = {
    DATA_BUCKET = "${google_storage_bucket.data_bucket.name}"
    OAUTH_CLIENT_ID = "${var.oauth_client_id}"
  }
}

output "web_frontend" {
  value       = "${google_storage_bucket.web_bucket.url}"
}

output "project.function_url" {
  value       = "${module.project.function_url}"
}

output "list_projects.function_url" {
  value       = "${module.list_projects.function_url}"
}