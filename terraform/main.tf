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

data "archive_file" "project" {
  type = "zip"
  source_dir = "src/project"
  output_path = "dist/project.zip"
}

resource "google_storage_bucket_object" "project_function" {
  name   = "functions/project${data.archive_file.project.output_sha}.zip"
  bucket = "${google_storage_bucket.data_bucket.name}"
  source = "${data.archive_file.project.output_path}"
}

resource "google_cloudfunctions_function" "project" {
  name   = "project"
  available_memory_mb = 128
  source_archive_bucket = "${google_storage_bucket.data_bucket.name}"
  source_archive_object = "${google_storage_bucket_object.project_function.name}"
  trigger_http = true
  service_account_email = "${google_service_account.functions.email}"
  project = "${var.project}"
  region = "${var.region}"
  runtime = "python37"
  timeout = 10
  entry_point = "project"
  environment_variables = {
    DATA_BUCKET = "${google_storage_bucket.data_bucket.name}"
    OAUTH_CLIENT_ID = "${var.oauth_client_id}"
  }
}
data "archive_file" "list_projects" {
  type = "zip"
  source_dir = "src/list_projects"
  output_path = "dist/list_projects.zip"
}

resource "google_storage_bucket_object" "list_projects_function" {
  name   = "functions/list_projects${data.archive_file.list_projects.output_sha}.zip"
  bucket = "${google_storage_bucket.data_bucket.name}"
  source = "${data.archive_file.list_projects.output_path}"
}

resource "google_cloudfunctions_function" "list_projects" {
  name   = "list-projects"
  available_memory_mb = 128
  source_archive_bucket = "${google_storage_bucket.data_bucket.name}"
  source_archive_object = "${google_storage_bucket_object.list_projects_function.name}"
  trigger_http = true
  service_account_email = "${google_service_account.functions.email}"
  project = "${var.project}"
  region = "${var.region}"
  runtime = "python37"
  timeout = 10
  entry_point = "list_projects"
  environment_variables = {
    DATA_BUCKET = "${google_storage_bucket.data_bucket.name}"
    OAUTH_CLIENT_ID = "${var.oauth_client_id}"
  }
}

output "web_frontend" {
  value       = "${google_storage_bucket.web_bucket.url}"
}

output "function_list_projects_url" {
  value       = "${google_cloudfunctions_function.list_projects.https_trigger_url}"
}

output "function_project_url" {
  value       = "${google_cloudfunctions_function.project.https_trigger_url}"
}