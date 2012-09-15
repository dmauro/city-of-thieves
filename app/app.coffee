# Requirements
connect = require 'connect'
express = require 'express'

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
    app.use express.static "#{cwd}/static"
)
app.set 'view engine', 'jade'
app.set 'view options', {layout: false}
compress.views_init app

app.get "/", (req, res) ->
    res.render "index"

app.listen port, ip
console.log "Server is running at http://#{ip}:#{port}"
