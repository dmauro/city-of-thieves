(function() {
    // Get name if we don't have it
    $(function() {
        if (window.dev_mode) {
            game.nickname = "dev_user";
            return false;
        }
        console.log("Did we get sent a nickname?", game.nickname);
        game.nickname = game.nickname || prompt("Sorry, we didn't catch your name:") || "thief";
    });

    window.lobby = {};

    lobby.init = function() {
        lobby.nodes = {
            lobby   : $('#lobby'),
            game    : $('#game'),
            players : $('#lobby .player_list ul'),
            start   : $('#lobby .start'),
            waiting : $('#lobby .start .waiting'),
            ready   : $('#lobby .start .ready'),
            share   : $('#lobby .start input'),
            summary : $('#lobby .summary'),
            snail   : $('#lobby .snail'),
        };
        lobby.nodes.share.val(window.location.href.split('?')[0]);
    };
    $(function() {
        lobby.init();
    });

    lobby.set_players = function(other_players) {
        dom_string = "";
        add_player = function(id, name, is_bold) {
            dom_string += '<li data-id="' + id + '">';
            if (is_bold) {
                dom_string += '<b>';
            }
            dom_string += name;
            if (is_bold) {
                dom_string += '</b>';
            }
            dom_string += '</li>';
        };
        add_player(0, game.nickname, true);
        $.each(other_players, function(_, stub) {
            add_player(stub.id, stub.nickname);
        });
        lobby.nodes.players.html(dom_string);
    };

    lobby.is_ready = function() {
        lobby.nodes.waiting.hide();
        lobby.nodes.ready.show();
    };

    lobby.start_game = function() {
        lobby.nodes.lobby.hide();
        lobby.nodes.game.show();
    };

    lobby.game_summary = function() {
        lobby.nodes.game.hide();
        lobby.nodes.lobby.show();
        lobby.nodes.start.hide();
        lobby.nodes.summary.show();
        // Show winner
        var high_score = -Infinity;
        var high_player = null;
        $.each(game.thieves, function(id, thief) {
            if (thief.treasure.length > high_score) {
                high_score = thief.treasure.length;
                // Assume it's you if they aren't in other players.
                high_player = (game.other_players[id]) ? game.other_players[id].nickname : game.nickname;
            }
        });
        lobby.nodes.snail.append('<p>' + high_player + ' - ' + high_score + 'pts</p>');
        setTimeout(function() {
            document.location.reload();
        }, 10 * 1000);
        var audio = $('<audio><source src="/sfx/score-board.mp3" type="audio/mp3"></audio>');
        $('body').append(audio);
        audio[0].play();
    };
})();
