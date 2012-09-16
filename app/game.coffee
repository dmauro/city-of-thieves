#alea = require('../static/js/lib/alea.js').alea_random

module.exports.lobbies = _lobbies = {}
module.exports.players = _players = {}
_min_players = 1;
_max_players = 4;
_game_length = 3 * 60 * 1000;

class Lobby
    constructor: (@id) ->
        @players = []
        @ready = false
        @full = false
        @is_playing = false
        @game_timer = null
        _lobbies[@id] = @

    broadcast: (name, data, is_volatile=false, exclude=null) ->
        for player in @players
            continue if exclude and player.id is exclude
            if is_volatile
                player.socket.volatile.emit name, data
            else
                player.socket.emit name, data

    listen_for_start: ->
        for player in @players
            player.listen_for_start()

    add_player: (player) ->
        # Make sure their nickname is available
        i = 1
        while true
            name_available = true
            for _player in @players
                name_available = false if _player.nickname is player.nickname
            if name_available
                break
            else
                player.nickname = player.nickname + "_" + i
            i++

        @broadcast 'player_added', player.get_stub();
        other_players = {}
        for other_player in @players
            other_players[other_player.id] = other_player.get_stub()
        @players.push player
        player.lobby = @
        @full = @players.length >= _max_players
        player.socket.emit 'added_to_lobby', {
            id              : @id
            is_ready        : @ready
            player_count    : @players.length
            other_players   : other_players
            your_nick       : player.nickname
        }
        if @players.length >= _min_players and not @ready
            @ready = true
            console.log "listening for start and broadcasting ready"
            @listen_for_start()
            @broadcast 'ready'
        else if @ready
            player.listen_for_start()

    remove_player: (player) ->
        @broadcast 'player_dropped', player.get_stub()
        for i in [0...@players.length]
            if @players[i] is player
                @players.splice i, 1
                break
        if @ready and @players.length < _min_players
            @ready = false
            @broadcast 'unready'
        @full = @players.length >= _max_players
        unless @players.length
            @remove()

    end_game: ->
        @broadcast 'end_game'

    start_game: ->
        for player in @players
            player.start_game()
        # Set timer for round ending
        @game_timer = setTimeout =>
            @end_game()
        , _game_length
        @is_playing = true

    remove: ->
        clearTimeout @game_timer
        delete _lobbies[@id]

class Player
    constructor: (@socket, @id = new Date().getTime()) ->
        @nickname = "undefined_" + @id
        @socket.set 'id', @id
        @lobby = null
        _players[@id] = @
        # Listen for events
        @socket.on 'join_lobby', (data) =>
            @put_in_lobby data
        @socket.on 'disconnect', (data) =>
            @lobby.remove_player @
        @socket.on 'player_move', (data) =>
            data['id'] = @id
            @lobby.broadcast 'player_move', data, true, @id
        @socket.on 'player_steal', (data) =>
            data['id'] = @id
            @lobby.broadcast 'player_steal', data, true, @id
        @socket.on 'set_nickname', (data) =>
            @nickname = data.nickname
        @socket.emit 'connection_established'

    put_in_lobby: (data) ->
        for _id, _lobby of _lobbies
            if _id is data.id.toString()
                lobby = _lobby 
                break
        unless lobby
            lobby = new Lobby data.id
        lobby.add_player @

    listen_for_start: ->
        console.log "Listening for this player"
        @socket.on 'start_game', =>
            console.log "WE GOT THE CLICK"
            @lobby.start_game()

    start_game: ->
        other_players = []
        for player in @lobby.players
            continue if player is @
            other_players.push player.id
        @socket.emit "start_game", {
            other_players   : other_players
        }

    get_stub: ->
        return {
            id          : @id
            nickname    : @nickname
        }

module.exports.init = (io) ->
    io.sockets.on 'connection', (socket) ->
        player = new Player socket
