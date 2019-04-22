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

var upload_url = null

$(document).ready(function () {
    $("#submit").attr("disabled", true);
    $("#submit").click(function () {
        let file = document.getElementById("fileupload").files[0];
        let xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.send(file);
        location.reload(true);
    });
});

registerRenderer(function () {
    fetch_with_auth(function_list_projects, function (data) {
        upload_url = data["new_project_upload_url"];
        $("#submit").attr("disabled", false);
        let projects_list = $("#projects");
        data["projects"].forEach(function(project) {
            project_html = $(`<li class='list-group-item'><a href='project.html?id=${project["id"]}'z>${project["created"]}</a></li>`);
            projects_list.append(project_html);
        });
        $("#loading").css("display", "none");
        $("#projects_list").css("display", "block");
    });
});