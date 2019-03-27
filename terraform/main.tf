provider "google" {
 credentials = "${file("credentials.json")}"
 project     = "${project}"
 region      = "${region}"
}

terraform {
 backend "gcs" {}
}

