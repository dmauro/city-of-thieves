alea = require('../static/js/lib/alea.js').alea_random

_lobbies = {}
_players = {}
_min_players = 1;
_max_players = 2;


class Lobby
    constructor: (@id) ->
        @players = []
        @ready = false
        @full = false
        _lobbies[@id] = @

    broadcast: (name, data) ->
        for player in @players
            player.socket.emit name, data

    listen_for_start: ->
        for player in @players
            player.listen_for_start()

    add_player: (player) ->
        @broadcast 'player_added'
        @players.push player
        player.lobby = @
        @full = @players.length >= _max_players
        player.socket.emit 'added_to_lobby', {
            id              : @id
            is_ready        : @ready
            player_count    : @players.length
        }
        if @players.length >= _min_players and not @ready
            @ready = true
            console.log "listening for start and broadcasting ready"
            @listen_for_start()
            @broadcast 'ready'
        else if @ready
            player.listen_for_start()

    remove_player: (player) ->
        @broadcast 'player_dropped', {
            id : player.id
        }
        for i in [0...@players.length]
            if @players[i] is player
                @players.splice i, 1
                break
        if @ready and @players.length < _min_players
            @ready = false
            @broadcast 'unready'
        @full = @players.length >= _max_players

    start_game: ->
        for player in @players
            player.start_game()

class Player
    constructor: (@socket, @id = new Date().getTime()) ->
        @socket.set 'id', @id
        _players[@id] = @
        # Listen for events
        @socket.on 'lobby', (data) =>
            @put_in_lobby data
        @socket.on 'disconnect', (data) =>
            @lobby.remove_player @
        @socket.emit 'connection_established'

    put_in_lobby: (data) ->
        if data
            for _id, _lobby of _lobbies
                if _id is data.id
                    lobby = _lobby 
                    break
        unless lobby
            # Try to find a lobby for them
            for _, _lobby of _lobbies
                if not _lobby.full
                    lobby = _lobby
                    break
        unless lobby
            # Otherwise make one for them
            id = if data and data.id then data.id else new Date().getTime()
            lobby = new Lobby id
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

module.exports.init = (io) ->
    io.sockets.on 'connection', (socket) ->
        player = new Player socket
