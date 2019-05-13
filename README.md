# OpenPLS: A web service for performing data analysis using Partial Least Squares

_Please note: This is not an officially supported Google product._

OpenPLS is a tool that lets you perform Partial Least Squares Path Modeling on datasets using a GUI interface. You can upload datasets in the form of csv file, design the model through the GUI, and then see the results.

OpenPLS was also created for a couple of other reasons:

* To show how to build cloud native apps using GCP in the [JAM](https://jamstack.org/) paradigm;
* To provide a template that you can start with to create your own applications using this paradigm.

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