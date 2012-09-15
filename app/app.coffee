# Requirements
connect = require 'connect'
express = require 'express'
sio = require 'socket.io'
game = require './game'

# Global vars
port = 1428
ip = "127.0.0.1"
cwd = process.cwd()

# Build and run server
app = express.createServer()
app.configure(->
    app.use express.logger()
    app.use express.bodyParser()
    app.use app.router
    app.use express.static "#{cwd}/static", { maxAge: 1000*60*60*24 }
)
app.set 'view engine', 'jade'
app.set 'view options', {layout: false}

app.get "/", (req, res) ->
    res.render "game"

app.get "/game/:id", (req, res) ->
    res.render "game", { lobby_id : req.params.id }

io = sio.listen app
game.init io

app.listen port, ip
console.log "Server is running at http://#{ip}:#{port}"
