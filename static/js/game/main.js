game = {
    tile_size: 64,
    height: 37,
    width: 15,
    state: {},
    players: {},
    guards: [],
    thief_prob: .1, 
    begun: false,
    when_ready: [],
}

game.tiled = function(x) {
    return x * game.tile_size;
}

game.end = function(x) {
    console.log("Ending the game");
    game.player.disableControl();
    scenes.unbind();
}

game.get_collision_poly = function() {
    var polys = [
        [10, 10],
        [54, 10],
        [54, 54],
        [10, 54]];
    return new Crafty.polygon(polys);
}

game.place = function(sprite, x, y, z) {
    var e = Crafty.e("2D, DOM, "+sprite).attr('z',x+1 * y+1);
    game.place_random(e);
    return e;
}

game.place_random = function(e, noalea) {
    if (noalea) {
        var x = Math.floor((Math.random()*(game.width_px-65)));
        var y = Math.floor((Math.random()*(game.height_px-105)));
    } else {
        var x = game.random.range(0, game.width_px-65);
        var y = game.random.range(0, game.height_px-105);
    }
    e.attr({x:x, y:y, z:999});
}

game.create_thief = function(x, y) {
    return game.place('big-guy1, Thief, Collision, Other, Directional', x, y, 1).Directional("big-guy")
        .collision(game.get_collision_poly())
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
    var sprite = function(prefix) {
        var dirs = [
            [1, [130,0]],
            [2, [195,105]],
            [3, [195,0]],
            [4, [130,105]],
            [6, [65,105]],
            [7, [65,0]],
            [8, [0,105]],
            [9, [0,0]]
        ]
        var map = {};
        $.each(dirs, function(i, dir) {
            map[prefix+dir[0]] = dir[1].concat([65,105]);
        })
        Crafty.sprite(1, "/img/sprite-"+prefix+".png", map);
    }
    sprite("doll-finn");
    sprite("big-guy");
}

game.init_sounds = function() {
    //Crafty.audio.add("shoot", "sound/shoot.wav");
}

game.init_scenes = function() {
    scenes.init();
}

game.bound = function(e, px, py) {
    if (e.hit('solid') || e.x <= 0 || e.y < 0 || e.x > (game.width_px - 65) || e.y > (game.height_px - 105)) {
        e.attr({x: px, y: py});
        e.dx *= -1;
        e.dy *= -1;
        if (e.onDirectionChange) {
            e.onDirectionChange(e.dx*-1, e.dy*-1, e.dx, e.dy);
        }
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
        Directional: function(name, is_guard) {
            var e = this;
            this.onDirectionChange = function(pdx, pdy, dx, dy) {
                var map = [null,
                    "-1,-1", "0,-1", "1,-1",
                    "-1,0",  null,   "1,0",
                    "-1,1",  "0,1",  "1,1",
                ];
                var psprite = name + map.indexOf(pdx+","+pdy);
                e.npdir = map.indexOf(dx+","+dy);
                if (e.npdir == -1) { e.npdir = 9}
                var nsprite = name + e.npdir;

                if (map[nsprite] !== null && nsprite !== psprite) {
                    if (pdx || pdy) {
                        e.removeComponent(psprite);
                    }
                    e.addComponent(nsprite);
                }

                /*
                if (is_guard && (e.npdir != 5 && e.npdir != -1)) {
                    //var points = [[0,0],[-80,-160],[80,-160]];
                    var points = [[-50,0],[-50,-200],[50,-200], [50,0]];
                    var npoints = [];
                    var angles = [null,
                        -Math.PI/4, 0, Math.PI/4,
                        -Math.PI/2, 0, Math.PI/2,
                        -Math.PI/4*3, Math.PI, Math.PI/4*3,
                    ];
                    var a = angles[e.npdir];
                    $.each(points, function(i, point) {
                        var x = point[0];
                        var y = point[1];
                        var nx = Math.floor(x*Math.cos(a) - y*Math.sin(a));
                        var ny = Math.floor(y*Math.cos(a) + x*Math.sin(a));
                        nx += 32
                        ny += 42;
                        npoints.push([nx, ny]);
                    });
                    var guardpoly = new Crafty.polygon(npoints);
                    e.collision(game.get_collision_poly(e)).addComponent("WiredHitBox");
                }
                */
            }
            this.onDirectionChange()
            return this;
        },
    });
    Crafty.c("Other", {
        init: function() {
            this.requires("Collision");
        }
    });
    Crafty.c("Guard", {
        init: function() {
            var guard = this;
            this.prev_collisions = [];
            this.requires("Collision")
                .bind("EnterFrame", function(event) {
                    if (event.frame % 5) { return; }
                    var collisions = guard.hit('Thief');
                    if (collisions !== false) {
                        $.each(this.prev_collisions, function(i, c) { c.obj.conceal(); });
                        $.each(collisions, function(i, c) { c.obj.reveal(); });
                        guard.prev_collisions = collisions.slice(0);
                    } else {
                        $.each(guard.prev_collisions, function(i, c) { c.obj.conceal(); });
                    }
                })
                ;
        },
        hit2: function (comp) {
            var area = this._mbr || this,
                results = Crafty.map.search(area, false),
                i = 0, l = results.length,
                dupes = {},
                id, obj, oarea, key,
                hasMap = ('map' in this && 'containsPoint' in this.map),
                finalresult = [];

            if (!l) {
                return false;
            }

            for (; i < l; ++i) {
                obj = results[i];
                oarea = obj._mbr || obj; //use the mbr

                if (!obj) continue;
                id = obj[0];

                //check if not added to hash and that actually intersects
                if (!dupes[id] && this[0] !== id && obj.__c[comp]) {/* &&
                                 oarea._x < area._x + area._w && oarea._x + oarea._w > area._x &&
                                 oarea._y < area._y + area._h && oarea._h + oarea._y > area._y)*/
                    dupes[id] = obj;}
            }

            for (key in dupes) {
                obj = dupes[key];

                if (hasMap && 'map' in obj) {
                    var SAT = this._SAT(this.map, obj.map);
                    SAT.obj = obj;
                    SAT.type = "SAT";
                    if (SAT) finalresult.push(SAT);
                } else {
                    finalresult.push({ obj: obj, type: "MBR" });
                }
            }

            if (!finalresult.length) {
                return false;
            }

            return finalresult;
        },
    })
    Crafty.c("Player", {
        init: function() {
            this.pdx = 0;
            this.pdy = 0;
            var player = this;
            this.requires("Collision")
                .bind('Moved', function(from) {
                    window.player_move(this.x, this.y);
                })
                .bind('NewDirection', function(data) {
                    if (data.x || data.y) {
                        var x = Math.floor(data.x*2), y = Math.floor(data.y*2); 
                        player.onDirectionChange(player.pdx, player.pdy, x, y);
                        player.pdx = x;
                        player.pdy = y;
                    }
                })
                .onHit('Thief',
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
                        this.thief_collision = null;
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
    game.player = Crafty.e("2D, DOM, big-guy1, Thief, LeftControls, Collision, Directional, Player, Bounded")
            .collision(game.get_collision_poly())
            .leftControls(.5)
            .Directional("big-guy")
            .Bounded()

    game.place_random(game.player, true);
    // Send initial coordinates to the server.
    window.player_move(game.player.x, game.player.y);

    var mk_guard = function(name) {
        var guard = Crafty.e("2D, DOM, doll-finn1, Bounded, Directional, Guard").Bounded().Directional(name, true)
            .attr({speed: 2})
            .collision(new Crafty.polygon([[0,0],[65,0],[65,105],[0,105]]));
        game.place_random(guard);
        scenes.ais.push(guard);
        game.guards.push(guard);
    }
    mk_guard("doll-finn");
    mk_guard("doll-finn");
}

game.generate_world = function() {
    game.iso = Crafty.isometric.size(game.tile_size);
	for(var i = game.width-1; i >= 0; i--) {
		for(var y = 0; y < game.height; y++) {
            if (i >1 && !game.random.range(0, 1/game.thief_prob)) {
                scenes.ais.push(game.create_thief(i, y));
            }
		}
	}
}

game.init = function() {
    socket_connect();
}

game.begin = function() {
    game.width_px = 960;
    game.height_px = 592;
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
