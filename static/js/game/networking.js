(function() {
    window.socket_connect = function() {
        window.socket = io.connect('http://127.0.0.1:1428');
        socket.on("connection_established", function() {
            data = (game.seed) ? { id: game.seed } : null;
            socket.emit("lobby", data);
            socket.on("added_to_lobby", function(data) {
                console.log("WE ARE IN A LOBBY");
                game.random = alea_random(data.id);
                socket.on("ready", function() {
                    console.log("WE HAVE ENOUGH PLAYERS");
                    // We can press start to begin now, or another player can
                    var button = $('<div style="width:300px;height:50px;background:blue;margin:20px auto;">Start</div>');
                    $('body').append(button);
                    button.click(function() {
                        socket.emit("start_game");
                    })
                    socket.on("start_game", function() {
                        game.begin();
                        button.remove();
                    });
                });
            });
        });
    }
})();
