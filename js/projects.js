// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var upload_url = null;
var new_project_uuid = null;
var new_project_name = "";

function fa_button(icon, title, style = "", onclick = "") {
    return `<a href="#" title="${title}" style="${style}" onclick="${onclick}" class="fa-stack fa-lg">
    <i class="fa fa-circle fa-stack-2x"></i>
    <i class="fa ${icon} fa-stack-1x fa-inverse"></i>
  </span>`;
}

function upload_project() {
    let file = document.getElementById("fileupload").files[0];
    if (file == null || !file.name.endsWith(".csv")) {
        alert("You can only create a new project from a CSV file");
    } else {
        new_project_name = file.name;
        let xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.timeout = 10000;
        xhr.onload = project_file_uploaded;
        xhr.send(file);
    }
}

$(document).ready(function () {
    $("#submit").attr("disabled", true);
    $("#submit").click(upload_project);
});

function getProjectConfig(id, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", project_function_url + "/" + id);
    xhr.onload = function() {
        callback(xhr.response);
    };
    add_auth_header(xhr);
    xhr.send();
}

function setProjectConfig(id, config, callback=null) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", project_function_url + "/" + id);
    add_auth_header(xhr);
    if (callback != null) {
        xhr.onload = function() {
            callback(xhr.response);
        };    
    }
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 10000;
    xhr.send(JSON.stringify(config));
}

function project_file_uploaded() {
    renameProject(new_project_uuid, new_project_name.substr(0, new_project_name.length - 4));
}

function deleteProject(id) {
    sure = confirm("Are you sure you want to delete this project?");
    if (sure) {
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", project_function_url + "/" + id);
        add_auth_header(xhr);
        xhr.timeout = 10000;
        xhr.onload = function () {
            location.reload(true);
        }
        xhr.send();
    }
}

function renameProject(id, name) {
    if (name != null) {
        getProjectConfig(id, function (response) {
            project_config = JSON.parse(response);
            project_config["name"] = name;
            setProjectConfig(id, project_config, function(data) {
                location.reload(true);
            });
        });
    }
}

registerRenderer(function () {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", list_projects_function_url);
    add_auth_header(xhr);
    xhr.onload = function () {
        data = JSON.parse(xhr.response);
        upload_url = data["new_project_upload_url"];
        new_project_uuid = data["new_project_uuid"];
        $("#submit").attr("disabled", false);
        let projects_list = $("#projects");
        projects_list.html("");
        data["projects"].forEach(function (project) {
            let project_name = !("name" in project) || project["name"] == "" ? "[Unnamed]" : project["name"];
            let delete_button = fa_button("fa-trash", "Delete project", "float:right", `deleteProject('${project["id"]}')`);
            let rename_button = fa_button("fa-edit", "Rename project", "float:right", `renameProject('${project["id"]}', prompt('Rename project', '${project_name}'))`);
            let project_link = `<a class="align-middle" href="project.html?id=${project["id"]}">${project_name}</a><br/>
                Created ${project["created"]}`
            let project_html = $(`<li class='list-group-item'>${delete_button}${rename_button}${project_link}</li>`);
            projects_list.append(project_html);
        });
        $("#loading").css("display", "none");
        $("#projects_list").css("display", "block");
    };
    xhr.send();
});