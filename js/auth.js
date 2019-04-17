var id_token = null
var renderers = []

function registerRenderer(renderer) {
    renderers.push(renderer);
}

function onSignIn(googleUser) {
    id_token = googleUser.getAuthResponse().id_token;
    renderers.forEach(function(callback) {
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
    gapi.load('auth2', function() {
        // initialize authorization with OAuth client id
        auth2 = gapi.auth2.init({
            client_id: oauth_client_id
        });
        // make sure we show / hide login / logout buttons and main panel based on login status
        gauth = gapi.auth2.getAuthInstance()    
        gauth.isSignedIn.listen(function(isSignedIn) {
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