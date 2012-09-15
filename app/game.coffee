alea = require('../static/js/lib/alea.js').alea_random

_lobbies = {}
_players = {}
_min_players = 1;
_max_players = 2;


class Lobby
    constructor: (@id) ->
        @players = []
        @ready = false
        _lobbies[@id] = @

    broadcast: (name, data) ->
        for player in @players
            player.socket.emit name, data

    listen_for_start: ->
        for player in @players
            player.listen_for_start()

    add_player: (player) ->
        @players.push player
        player.lobby = @
        @ready = @players.length >= _min_players
        player.socket.emit 'added_to_lobby', { id : @id }
        if @ready
            console.log "listening for start and broadcasting ready"
            @listen_for_start()
            @broadcast 'ready'

    start_game: ->
        @broadcast 'start_game'

class Player
    constructor: (@socket, @id = new Date().getTime()) ->
        @socket.set 'id', @id
        _players[@id] = @
        # Listen for events
        @socket.on 'lobby', (data) =>
            @put_in_lobby data
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
                if not _lobby.ready
                    lobby = _lobby
                    break
        unless lobby
            # Otherwise make one for them
            id = if data and data.id then data.id else new Date().getTime()
            lobby = new Lobby id
        lobby.add_player @

    listen_for_start: ->
        @socket.on 'start_game', =>
            @lobby.start_game()

module.exports.init = (io) ->
    io.sockets.on 'connection', (socket) ->
        player = new Player socket
