(function() {
    window.socket_connect = function() {
        var socket = io.connect('http://127.0.0.1:1428');
        socket.on("connection_established", function() {
            data = (game.seed) ? { id: game.seed } : null;
            socket.emit("lobby", data);
            socket.on("added_to_lobby", function(data) {
                game.random = alea_random(data.id);
                game.begin();
            });
        });
    }
})();
