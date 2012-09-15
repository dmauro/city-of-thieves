scenes = {
    unbindable: [],
}

scenes.bind = function(name, callback) {
    scenes.unbindable.push([name, callback]);
    Crafty.bind(name, callback);
}

scenes.unbind = function() {
    $.each(scenes.unbindable, function(i, tuple) {
        Crafty.unbind(tuple[0], tuple[1]);
    });
}

scenes.init = function() {
    Crafty.scene("main",
        function() {
            game.generate_world();
            game.init_players();

            Crafty.viewport.zoom(1, 200, 0, 200);
            setTimeout(function() {
                /*scenes.bind("EnterFrame", function(event) {
                    var frame = event.frame;
                    if (frame % 2 === 0) {
                        Crafty.viewport.y -= 1;
                        if (Crafty.viewport.y % (game.tile_size) === 0) {
                            game.generate_row();
                        }
                    }
                })*/
                scenes.bind('KeyDown', function (e) {
                    if (e.key == Crafty.keys['SPACE']) {
                        game.player.shoot();
                    }
                })
            }, 1000);
        }/*,
        function() {
            scenes.unbind();
        }*/
    );
}
