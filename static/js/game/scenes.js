scenes = {
    unbindable: [],
    ais: [],
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

scenes.init_ai = function() {
}

scenes.init = function() {
    Crafty.scene("main",
        function() {
            var scene = this;
            scene.ticks = 0

            game.generate_world();
            game.init_players();
            scenes.init_ai();

            setTimeout(function() {
                scenes.bind("EnterFrame", function(event) {
                    var frame = event.frame;
                    if (frame % 2 === 0) {
                        scene.ticks += 1
                        $.each(scenes.ais, function(i, ai) {
                            if (ai.frozen) { return; }
                            px = ai.x;
                            py = ai.y;
                            if (!game.random.range(0, 30)) {
                                var pdx = ai.dx || 0;
                                var pdy = ai.dy || 0;
                                ai.dx = game.random.range(-1, 1);
                                ai.dy = game.random.range(-1, 1);
                                if (ai.onDirectionChange) {
                                    ai.onDirectionChange(pdx, pdy, ai.dx, ai.dy);
                                }
                            }
                            ai.x += (ai.dx || 0) * (ai.speed || 1);
                            ai.y += (ai.dy || 0) * (ai.speed || 1);
                            game.bound(ai, px, py);
                        });
                    }
                });
                scenes.bind('KeyDown', function (e) {
                    if (e.key == Crafty.keys['SPACE']) {
                        game.player.steal();
                    }
                });
            }, 1000);
        }/*,
        function() {
            scenes.unbind();
        }*/
    );
}
