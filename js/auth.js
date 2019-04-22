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
}

function toggleAuthStatus(signedIn) {
    $("#g-signout-btn").css("display", signedIn ? "block" : "none")
    $("#login").css("display", signedIn ? "none" : "block")
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
    });
}

function fetch_auth_header() {
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + id_token);
    return headers;
}

function fetch_with_auth(url, callback) {
    const init = { method: 'GET', mode: 'cors', headers: fetch_auth_header() }
    fetch(url, init)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP error, status ' + response.status);
            }
            response.json().then(callback);
        });
}