# OpenPLS: A web service for performing data analysis using Partial Least Squares

_Please note: This is not an officially supported Google product._

This app was built to demonstrate how to build an application consisting of a static website on the front end, which uses JavaScript talking to Cloud Functions on the back end.

## Building the project

In order to build the project, you need the following prerequisites:

* Bash
* The [gcloud command-line tool](https://cloud.google.com/sdk/gcloud/)
* [Terraform](https://www.terraform.io/)

You also need to pass the deploy script three pieces of information:

* A billing account ID
* A folder ID
* An [OAuth Client ID](https://console.cloud.google.com/apis/credentials) which whitelists storage.googleapis.com and localhost:4000 as authorized javascript origins"

When you deploy for the first time, run `deploy.sh -f <folder id> -b <billing id> -o <oauth_client_id>`.

Once everything has been set up the first time, you can just run `deploy.sh`

## Maintainer

[Jez Humble](https://github.com/jezhumble) (humble at google.com)