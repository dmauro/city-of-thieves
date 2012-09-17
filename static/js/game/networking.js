(function() {
    var _player_count = 0;
    game.other_players = {};

    var _local_host = 'http://127.0.0.1:1428' 
    var _production_host = 'http://dmauro.city-of-thieves.jit.su'

    var _host = (document.location.host === "127.0.0.1:1428" || document.location.host === "localhost") ? _local_host : _production_host;

    _listen_for_other_players = function() {
        socket.on("player_move", function(data) {
            game.on_player_moved(data.id, data.x, data.y, data.sprite);
        });
        socket.on("player_steal", function(data) {
            game.on_player_thieved(data.target);
        });
    }

    _ready_for_start = function() {
        console.log("WE HAVE ENOUGH PLAYERS");
        // We can press start to begin now, or another player can
        lobby.is_ready();
        console.log("listening for start game");
        if (window.dev_mode) {
            console.log("DEV MODE GO");
            socket.emit("start_game");
        }
        socket.on("start_game", function(data) {
            console.log("got start_game");
            lobby.start_game();
            _listen_for_other_players();
            game.begin();
        });
    }

    window.socket_connect = function() {
        window.socket = io.connect(_host);
        socket.on("connection_established", function() {
            socket.emit("set_nickname", { nickname : game.nickname });
            var data = (game.seed) ? { id: game.seed } : null;
            console.log("We're gonna try to connect to lobby:", game.seed);
            socket.emit("join_lobby", data);
            socket.on("added_to_lobby", function(data) {
                game.nickname = data.your_nick;
                _player_count = data.player_count;
                game.pid = data.your_id;
                game.other_players = data.other_players;
                lobby.set_players(game.other_players);
                console.log("WE ARE IN A LOBBY", data.id, " WITH X PLAYERS", data.player_count, data);
                if (data.is_ready) {
                    console.log("Joined a game already ready");
                    _ready_for_start();
                }
                game.random = alea_random(data.id);
                socket.on("player_added", function(data) {
                    console.log("A NEW PLAYER JOINED YOUR LOBBY");
                    _player_count++;
                    game.other_players[data.id] = data
                    lobby.set_players(game.other_players);
                });
                socket.on("player_dropped", function(data) {
                    console.log("A PLAYER HAS LEFT YOUR LOBBY");
                    _player_count--;
                    delete game.other_players[data.id]
                    lobby.set_players(game.other_players);
                });
                socket.on("ready", function() {
                    _ready_for_start();
                });
                socket.on("end_game", function() {
                    game.end();
                    lobby.game_summary();
                });
            });
        });
    }

    window.player_move = function(x, y, sprite) {
        socket.emit("player_move", {
            x : x,
            y : y,
            sprite: sprite,
        });
    };

    window.player_steal = function(target) {
        socket.emit("player_steal", {
            target : target
        });
    };
})();
