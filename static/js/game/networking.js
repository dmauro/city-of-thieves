(function() {
    var _player_count = 0;

    _listen_for_other_players = function() {
        socket.on("player_move", function(data) {
            var player = game.other_players[data.id];
            // Move to data.x, data.y
        });
        socket.on("player_steal", function(data) {
            var player = game.other_players[data.id];
            // This player is trying to steal from data.target
        });
    }

    _ready_for_start = function() {
        console.log("WE HAVE ENOUGH PLAYERS");
        // We can press start to begin now, or another player can
        window.button = $('<div style="width:300px;height:50px;background:blue;margin:20px auto;cursor:poiner;">Start</div>');
        $('body').append(button);
        button.click(function() {
            console.log("click");
            socket.emit("start_game");
        })
        socket.on("start_game", function(data) {
            game.other_players = data.other_players
            game.begin();
            button.remove();
            _listen_for_other_players();
        });
    }

    window.socket_connect = function() {
        window.socket = io.connect('http://127.0.0.1:1428');
        socket.on("connection_established", function() {
            var data = (game.seed) ? { id: game.seed } : null;
            console.log("We're gonna try to connect to lobby:", game.seed);
            socket.emit("lobby", data);
            socket.on("added_to_lobby", function(data) {
                _player_count = data.player_count;
                console.log("WE ARE IN A LOBBY", data.id, " WITH X PLAYERS", data.player_count);
                if (data.is_ready) {
                    console.log("Joined a game already ready");
                    _ready_for_start();
                }
                game.random = alea_random(data.id);
                socket.on("player_added", function() {
                    console.log("A NEW PLAYER JOINED YOUR LOBBY");
                    _player_count++;
                });
                socket.on("player_dropped", function(data) {
                    console.log("A PLAYER HAS LEFT YOUR LOBBY");
                    _player_count--;
                });
                socket.on("ready", function() {
                    _ready_for_start();
                });
            });
        });
    }

    window.player_move = function(x, y) {
        socket.volatile.emit("player_move", {
            x : x,
            y : y
        });
    };

    window.player_steal = function(target) {
        socket.volatile.emit("player_steal", {
            target : target
        });
    };
})();
