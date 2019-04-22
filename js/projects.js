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

function project_file_uploaded() {
    let xhr = new XMLHttpRequest();
    xhr.open("PUT", upload_url);
    xhr.timeout = 10000;
    xhr.onload = function () {
        location.reload(true);
    }
}

$(document).ready(function () {
    $("#submit").attr("disabled", true);
    $("#submit").click(function () {
        let file = document.getElementById("fileupload").files[0];
        if (file == null || !file.name.endsWith("csv")) {
            alert("You can only create a new project from a CSV file");
        } else {
            new_project_name = file.name;
            let xhr = new XMLHttpRequest();
            xhr.open("PUT", upload_url);
            xhr.timeout = 10000;
            xhr.onload = project_file_uploaded;
            xhr.send(file);
        }
    });
});

function deleteProject(id) {
    sure = confirm("Are you sure you want to delete this project?");
    if (sure) {
        // Delete project
    }
}

function renameProject(id, name) {
    new_name = prompt("Rename project", name);
    if (new_name != null) {
        // Rename project
    }
}

registerRenderer(function () {
    fetch_with_auth(function_list_projects, function (data) {
        upload_url = data["new_project_upload_url"];
        new_project_uuid = data["new_project_uuid"];
        $("#submit").attr("disabled", false);
        let projects_list = $("#projects");
        projects_list.html("");
        data["projects"].forEach(function (project) {
            let project_name = !("name" in project) || project["name"] == "" ? "[Unnamed]" : project["name"];
            let delete_button = fa_button("fa-trash", "Delete project", "float:right", `deleteProject('${project["id"]}')`);
            let rename_button = fa_button("fa-edit", "Rename project", "float:right", `renameProject('${project["id"]}', '${project_name}')`);
            let project_link = `<a class="align-middle" href="project.html?id=${project["id"]}">${project_name}</a><br/>
                Created ${project["created"]}`
            let project_html = $(`<li class='list-group-item'>${delete_button}${rename_button}${project_link}</li>`);
            projects_list.append(project_html);
        });
        $("#loading").css("display", "none");
        $("#projects_list").css("display", "block");
    });
});