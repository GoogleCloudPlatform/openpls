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

var id_token = null
var profile = null
var renderers = []

function registerRenderer(renderer) {
    renderers.push(renderer);
}

function toggleAuthStatus(signedIn) {
    $("#g-signout-btn").css("display", signedIn ? "block" : "none")
    $("#login").css("display", signedIn ? "none" : "block")
}

function onSignIn(googleUser) {
    id_token = googleUser.getAuthResponse().id_token;
    profile = googleUser.getBasicProfile();
    renderers.forEach(function (callback) {
        callback();
    });
    $("#main").css("display", "block")
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        signedOut();
    });
    $("#main").css("display", "none")
    toggleAuthStatus(false)
}

function init() {
    gapi.load('auth2', function () {
        // initialize authorization with OAuth client id
        auth2 = gapi.auth2.init({
            client_id: oauth_client_id
        });
        // make sure we show / hide login / logout buttons and main panel based on login status
        gauth = gapi.auth2.getAuthInstance()
        gauth.isSignedIn.listen(function (isSignedIn) {
            toggleAuthStatus(isSignedIn);
        });
        // render the login button
        gapi.signin2.render("g-signin-btn", {
            scope: 'email',
            theme: 'dark',
            onsuccess: onSignIn,
            onfailure: null
        });
        toggleAuthStatus(false);
    });
}

function add_auth_header(xhr) {
    const timezone_offset = String(new Date().getTimezoneOffset());
    xhr.setRequestHeader("Authorization", "Bearer " + id_token);
    xhr.setRequestHeader("X-Timezone-Offset", timezone_offset);
}

function fa_button(icon, title, style = "", onclick = "") {
    return `<a href="#" title="${title}" style="${style}" onclick="${onclick}" class="fa-stack fa-lg">
    <i class="fa fa-circle fa-stack-2x"></i>
    <i class="fa ${icon} fa-stack-1x fa-inverse"></i>
  </span>`;
}