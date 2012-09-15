game = {
    tile_size: 64,
    height: 23,
    width: 14,
    state: {},
    players: {},
}

game.tiled = function(x) {
    return x * game.tile_size;
}

game.end = function(x) {
    game.player.stop().disableControl();
    scenes.unbind();
}

game.place = function(sprite, x, y, z) {
    var e = Crafty.e("2D, DOM, "+sprite).attr('z',x+1 * y+1);
    game.iso.place(x, y, z || 0, e);
    return e;
}

game.create_thief = function(x, y) {
    return game.place('stone, Collision', x, y, 1).attr({z: 999});
}
game.on_player_moved = function(pid, x, y) {
    if (game.players.pid === undefined) {
        game.players.pid = game.create_thief(x, y);
    } else {
        game.players.pid.attr({x: x, y: y});
    }
}

game.init_sprites = function() {
    Crafty.sprite(game.tile_size, "/img/sprite-iso64.png", {
		grass: [0,0,1,1],
		stone: [1,0,1,1]
	});
}

game.init_sounds = function() {
    //Crafty.audio.add("shoot", "sound/shoot.wav");
}

game.init_scenes = function() {
    scenes.init();
}

game.bound = function(e, px, py) {
    if (e.hit('solid')) {
        e.attr({x: px, y: py});
    }
    e.attr({z: e.y+100});
}

game.init_components = function() {
    Crafty.c('Bounded', {
        Bounded: function() {
            this.requires("Collision")
                .bind('Moved', function(from) {
                    game.bound(this, from.x, from.y);
                });
            return this;
        },
    });
};

game.init_players = function() {
    Crafty.c("LeftControls", {
        init: function() {
            this.requires('Multiway');
        },
        leftControls: function(speed) {
            this.multiway(speed, {W: -90, S: 90, D: 0, A: 180})
            return this;
        },

    });
    //create our player entity with some premade components
    var player = Crafty.e("2D, DOM, stone, LeftControls, Bounded")
            .leftControls(1)
            .Bounded()
            .attr({z: 999});
    game.iso.place(5, 5, 1, player);
    game.player = player;
}

game.generate_world = function() {
    game.iso = Crafty.isometric.size(game.tile_size);
	for(var i = game.width-1; i >= 0; i--) {
		for(var y = 0; y < game.height; y++) {
            if (!(i == game.width-1 && y % 2)) {
                game.place('grass', i, y);
            }
            if (!game.random.range(0, 60)) {
                scenes.ais.push(game.create_thief(i, y));
            }
		}
	}
}

game.init = function() {
    socket_connect();
}

game.begin = function() {
    Crafty.init(game.tiled(game.width), game.tiled(game.height/4)+game.tile_size);

    game.init_sprites();
    game.init_components();
    game.init_sounds();
    game.init_scenes();

    Crafty.scene("main");
}
