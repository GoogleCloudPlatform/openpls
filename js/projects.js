registerRenderer(function() {
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + id_token);
    const init = { method: 'GET', mode: 'cors', headers: headers }
    fetch(function_list_projects, init)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP error, status ' + response.status);
            }
            response.json().then(function (data) {
                $("#content").html(JSON.stringify(data));
            });
        });    
});