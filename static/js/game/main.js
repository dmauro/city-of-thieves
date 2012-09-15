game = {
    tile_size: 64,
    rows: [],
    height: 23,
    width: 14,
    state: {},
    others: 0,
    num_others: 50,
}

game.tiled = function(x) {
    return x * game.tile_size;
}

game.end = function(x) {
    game.player.stop().disableControl();
    scenes.unbind();
}

game.on_server_message = function(data) {
    console.log(data);
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
    Crafty.c('Player1', {
        Player1: function() {
            //setup animations
            this.requires("SpriteAnimation, Collision, Grid")
                .animate("walk_right", 0, 5, 2)
                .animate("walk_left", 0, 6, 2)
                .animate("walk_down", 0, 4, 2)
                .animate("walk_up", 0, 3, 2)
                //change direction when a direction change event is received
                .bind("NewDirection",
                    function (direction) {
                        if (direction.x || direction.y) {
                            this.dx = direction.x;
                            this.dy = direction.y;
                        }

                        if (direction.x > 0) {
                            if (!this.isPlaying("walk_left"))
                                this.stop().animate("walk_left", 10, -1);
                        }
                        if (direction.x < 0) {
                            if (!this.isPlaying("walk_right"))
                                this.stop().animate("walk_right", 10, -1);
                        }
                        if (direction.y > 0) {
                            if (!this.isPlaying("walk_up"))
                                this.stop().animate("walk_up", 10, -1);
                        }
                        if (direction.y < 0) {
                            if (!this.isPlaying("walk_down"))
                                this.stop().animate("walk_down", 10, -1);
                        }
                        if(!direction.x && !direction.y) {
                            this.stop();
                        }
                })
            return this;
        }
    });

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
            //.attr({ x: game.tile_size*12, y: game.tile_size * 3, z: 2 })
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
            var place = function(sprite, x, y, z) {
                var e = Crafty.e("2D, DOM, "+sprite).attr('z',i+1 * y+1);
                game.iso.place(x, y, z || 0, e);
                return e;
            }

            if (!(i == game.width-1 && y % 2)) {
                place('grass', i, y);
            }
            if (!game.random.range(0, 60)) {
                var ai = place('stone, Collision', i, y, 1).attr({z: 999});
                scenes.ais.push(ai);
            }
            /*if (y === 0 || (i === 0 && !(y % 2)) || ( i === game.width && y % 2)) {
                place('stone', i, y, 1);
            }*/ 
		}
	}
}

game.generate_row = function() {
    var y = game.rows.length;
    var ents = [];
    for (var x = 0; x < game.width; x++) {
        //place grass on all tiles
        grassType = game.random.range(1, 4);
        ents.push(Crafty.e("2D, DOM, grass" + grassType)
            .attr({ x: x * game.tile_size, y: y * game.tile_size, z:1 }));
        //create a fence of bushes
        if (x === 0 || x === game.width-1 || y === 0 || y === game.height-1 || game.random.range(1,20) === 1) {
            ents.push(Crafty.e("2D, DOM, solid, bush" + game.random.range(1, 2))
                .attr({x: game.tiled(x), y: game.tiled(y), z: 2}));
        } else if (game.others < game.num_others && y > 0 && !game.random.range(0,60)) {
            game.others += 1;
            var ent = Crafty.e("2D, DOM, player, Bounded").Bounded()
                .attr({x: game.tiled(x), y: game.tiled(y), z: 2});
            if (game.others === game.num_others) {
                ent.last = true;
            }
            scenes.ais.push(ent);
        }
    }
    game.rows.push(ents);
    if (game.rows.length > game.height+1) {
        var reap = (game.rows.length - game.height - 2);
        for (var i = 0; i < game.rows[reap].length; i++) {
            var ent = game.rows[reap][i];
            if (ent.last) {
                game.end();
            }
            game.rows[reap][i].destroy();
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
