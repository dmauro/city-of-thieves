game = {
    tile_size: 64,
    height: 23,
    width: 14,
    state: {},
    players: {},
    thief_prob: .1, 
    begun: false,
    when_ready: [],
}

game.tiled = function(x) {
    return x * game.tile_size;
}

game.end = function(x) {
    console.log("Ending the game");

    // GAME.PLAYER HAS NOT METHOD STOP? -dave

    game.player.stop().disableControl();
    scenes.unbind();
}

game.place = function(sprite, x, y, z) {
    var e = Crafty.e("2D, DOM, "+sprite).attr('z',x+1 * y+1);
    game.iso.place(x, y, z || 0, e);
    return e;
}

game.place_random = function(e, noalea) {
    if (noalea) {
        var x = Math.floor((Math.random()*game.width));
        var y = Math.floor((Math.random()*game.width));
    } else {
        var x = game.random.range(0, game.width);
        var y = game.random.range(0, game.height);
    }
    game.iso.place(x, y, 1, e.attr({z: 999}));
}

game.create_thief = function(x, y) {
    return game.place('stone, Thief, Collision, Other', x, y, 1)
        //.collision(new Crafty.polygon(game.hit_box.slice(0)))
        .attr({z: y+100});
}
game.on_player_moved = function(pid, x, y) {
    var handle = function() {
        if (game.players[pid] === undefined) {
            game.players[pid] = game.create_thief(x, y);
        }
        game.players[pid].attr({x: x, y: y, z: y+100});
    }

    // This may be called before we initialize, since everyone starts at once.
    if (game.begun) {
        handle();
    } else {
        game.when_ready.push(handle);
    }
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
    Crafty.c("Bounded", {
        Bounded: function() {
            this.requires("Collision")
                .bind('Moved', function(from) {
                    game.bound(this, from.x, from.y);
                });
            return this;
        },
    });
    Crafty.c("Thief", {
        init: function() {
            this.treasure = [0];
            this.requires("Text");
            this.revealed = false;
            $('#treasure').text(this.treasure.length);
            this.steal = function() {
                var other = this.thief_collision;
                if (other) {
                    this.treasure = this.treasure.concat(other.treasure);
                    other.treasure = [];
                    $('#treasure').text(this.treasure.length);
                }
            }
            this.reveal = function() {
                this.revealed = true;
                this.css("opacity", "0.5");
                this.text(""+this.treasure.length);

            }
            this.conceal = function() {
                this.revealed = false;
                this.css("opacity", "1");
                this.text(' ');
            }
        }

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
                    function(collisions) {
                        if (collisions.length) {
                            var first = collisions[0].obj;
                            if (!first.revealed) {
                                if (this.thief_collision) { this.thief_collision.conceal(); }
                                this.thief_collision = first;
                            }
                            first.reveal();
                        }
                    },
                    function() {
                        this.thief_collision && this.thief_collision.conceal();
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
    game.player = Crafty.e("2D, DOM, stone, Thief, LeftControls, Collision, Player, Bounded, WiredHitBox")
            .collision(new Crafty.polygon(game.hit_box.slice(0)))
            .leftControls(.5)
            .Bounded()

    game.place_random(game.player, true);
    // Send initial coordinates to the server.
    window.player_move(game.player.x, game.player.y);

    game.finn = Crafty.e("2D, DOM, finn1, Bounded, Directional").Bounded().Directional("finn");
    game.place_random(game.finn);
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

    // Handle events we get before the game state is initialized.
    game.begun = true;
    $.each(game.when_ready, function(i, el) { el(); });
}
