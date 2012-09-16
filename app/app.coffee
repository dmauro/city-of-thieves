# Requirements
connect = require 'connect'
express = require 'express'
sio = require 'socket.io'
game = require './game'

# Global vars
cwd = process.cwd()

# Build and run server
app = express.createServer()
app.configure(->
    app.use express.logger()
    app.use express.bodyParser()
    app.use app.router
    app.use express.static "#{cwd}/static", { maxAge: 1000*60 }
)
app.set 'view engine', 'jade'
app.set 'view options', {layout: false}

app.get "/", (req, res) ->
    res.render "start_screen"

app.get "/game/", (req, res) ->
    res.locals.nickname = req.query.nickname
    # Get a lobby to send them to:
    for _, lobby of game.lobbies
        unless lobby.full or lobby.is_playing
            lobby_id = lobby.id
            break
    unless lobby_id
        # Make a new ID
        lobby_id = new Date().getTime()
    res.redirect "/game/#{lobby_id}"

app.get "/game/:id", (req, res) ->
    res.render "game", {
        nickname    : res.locals.nickname
        lobby_id    : req.params.id
    }

io = sio.listen app
game.init io

if process.env.NODE_ENV is "development"
    port = 1428
    ip = "127.0.0.1"
    app.listen port, ip
    console.log "Server is running at http://#{ip}:#{port}"
else if process.env.NODE_ENV is "production"
    port = 80
    app.listen port
    console.log "Server is running in production."
