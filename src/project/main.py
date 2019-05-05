#!/usr/bin/python3
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.oauth2 import id_token
from google.auth.transport import requests
from google.auth import compute_engine
import json, os, uuid
import google.auth
from datetime import datetime, timedelta
from google.cloud import storage
import gcloud_flask_oauth_cors as oauth

def project(request):

    auth = oauth.Auth(os.getenv("OAUTH_CLIENT_ID"))
    id_info = auth.get_id_info(request)
    if id_info is None:
        return auth.get_response()

    # Set CORS headers for the main request
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/json'
    }

    credentials, project = google.auth.default()
    storage_client = storage.Client(project, credentials)
    data_bucket = storage_client.lookup_bucket(os.getenv("DATA_BUCKET"))
    if data_bucket is None:
        return "Couldn't find data bucket " + os.getenv("DATA_BUCKET"), 500

    response_data = ""

    if request.method == 'DELETE':
        contents = data_bucket.list_blobs(prefix=id_info["sub"] + request.path)
        for blob in contents:
            blob.delete()
        index_blob = data_bucket.blob(id_info["sub"] + "/index.json")
        try:
            index = json.loads(index_blob.download_as_string())
        except:
            index = {}
        index.pop(request.path[1:], "")
        index_blob.upload_from_string(json.dumps(index), "application/json")            

    if request.method == 'POST':
        config = request.get_json(silent=True)
        if config is None:
            print("Config was not in json format")
            return "Config must be supplied in JSON format", 400, headers
        config_blob = data_bucket.blob(id_info["sub"] + request.path + "/config.json")
        config_blob.upload_from_string(json.dumps(config), "application/json")
        if "name" in config:
            index_blob = data_bucket.blob(id_info["sub"] + "/index.json")
            try:
                index = json.loads(index_blob.download_as_string())
            except:
                index = {}
            index[request.path[1:]] = config["name"]
            index_blob.upload_from_string(json.dumps(index), "application/json")            

    if request.method == 'GET':
        config_blob = data_bucket.blob(id_info["sub"] + request.path + "/config.json")
        try:
            response_data = config_blob.download_as_string()
        except:
            response_data = "{}"

    return response_data, 200, headers
