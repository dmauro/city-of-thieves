game = {
    tile_size: 64,
    height: 23,
    width: 14,
    state: {},
    players: {},
    thief_prob: .1, 
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
    return game.place('stone, Collision, Other', x, y, 1)
        //.collision(new Crafty.polygon(game.hit_box.slice(0)))
        .attr({z: y+100});
}
game.on_player_moved = function(pid, x, y) {
    if (game.players[pid] === undefined) {
        game.players[pid] = game.create_thief(x, y);
    } else {
        game.players[pid].attr({x: x, y: y});
    }
    game.players[pid].attr({z: y+100});
}

game.init_sprites = function() {
    Crafty.sprite(game.tile_size, "/img/sprite-iso64.png", {
		grass: [0,0,1,1],
		stone: [1,0,1,1],
	});
    Crafty.sprite(1, "/img/sprite-finn.png", {
        finn1: [128,0,64,85],
        finn2: [196,85,64,85],
        finn3: [196,0,64,85],
        finn4: [128,85,64,85],
        finn6: [64,85,64,85],
        finn7: [64,0,64,85],
        finn8: [0,85,64,85],
        finn9: [0,0,64,85],
    });
}

game.init_sounds = function() {
    //Crafty.audio.add("shoot", "sound/shoot.wav");
}

game.init_scenes = function() {
    scenes.init();
}

game.bound = function(e, px, py) {
    if (e.hit('solid') || e.x <= 0 || e.y < -(game.tile_size/2) || e.x > game.width_px - game.tile_size/2 || e.y > game.height_px - game.tile_size) {
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
    Crafty.c("Directional", {
        Directional: function(name) {
            this.onDirectionChange = function(pdx, pdy, dx, dy) {
                var map = [null,
                    "-1,-1", "0,-1", "1,-1",
                    "-1,0",  null,   "1,0",
                    "-1,1",  "0,1",  "1,1",
                ];
                var psprite = name + map.indexOf(pdx+","+pdy);
                var nsprite = name + map.indexOf(dx+","+dy);

                if (map[nsprite] !== null && nsprite !== psprite) {
                    if (pdx || pdy) {
                        this.removeComponent(psprite);
                    }
                    this.addComponent(nsprite);
                }
            }
            return this;
        },
    });
    Crafty.c("Other", {
        init: function() {
            this.requires("Collision");
        }
    });
    Crafty.c("Player", {
        init: function() {
            this.requires("Collision")
                .bind('Moved', function(from) {
                    window.player_move(this.x, this.y);
                })
                .onHit('Other',
                    function() {
                        $('body').css({'background-color': 'green'});
                    },
                    function() {
                        $('body').css({'background-color': 'red'});
                    })
                ;
        },
    });
};

game.init_players = function() {
    Crafty.c("LeftControls", {
        init: function() {
            this.requires('Multiway')
        },
        leftControls: function(speed) {
            this.multiway(speed, {W: -90, S: 90, D: 0, A: 180})
            return this;
        },

    });
    //create our player entity with some premade components
    game.player = Crafty.e("2D, DOM, stone, LeftControls, Collision, Player, Bounded")
            .collision(new Crafty.polygon(game.hit_box.slice(0)))
            .leftControls(.5)
            .Bounded()
            .attr({z: 999});
    game.iso.place(5, 5, 1, game.player);

    game.finn = Crafty.e("2D, DOM, finn1, Bounded, Directional").Bounded().Directional("finn");
    game.iso.place(2, 2, 1, game.finn.attr({z: 999}));
    scenes.ais.push(game.finn);
}

game.generate_world = function() {
    game.iso = Crafty.isometric.size(game.tile_size);
	for(var i = game.width-1; i >= 0; i--) {
		for(var y = 0; y < game.height; y++) {
            if (!(i == game.width-1 && y % 2)) {
                game.place('grass', i, y);
            }
            if (!game.random.range(0, 1/game.thief_prob)) {
                scenes.ais.push(game.create_thief(i, y));
            }
		}
	}
}

game.init = function() {
    socket_connect();
}

game.begin = function() {
    game.width_px = game.tiled(game.width);
    game.height_px = game.tiled(game.height/4)+(game.tile_size/4);
    var tsq = game.tile_size / 8;
    game.hit_box = [[tsq*3,tsq*3],[tsq*5,tsq*3],[tsq*5,tsq*5],[tsq*3,tsq*5]];

    Crafty.init(game.width_px, game.height_px);

    game.init_sprites();
    game.init_components();
    game.init_sounds();
    game.init_scenes();

    Crafty.scene("main");
}
