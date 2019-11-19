const path = require( "path" );
const http = require( "http" );
const socketio = require( "socket.io" );
const express = require( "express" );
const Filter = require( "bad-words" );
const app = express();
const server = http.createServer( app );
const io = socketio( server );
const router = new express.Router();
const {
    generateMessage
} = require( "./utils/messages.js" );
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require( "./utils/users.js" );

app.use( express.static( path.join( __dirname, "../public" ) ) );

io.on( "connection", ( socket ) => {
    socket.on( "join", ( { username, room }, callback ) => {
        const { error, user } = addUser( {
            "id": socket.id,
            "username": username,
            "room": room
        } );

        if( error ){
            return callback( error );
        }

        socket.join( user.room );

        socket.emit( "message", generateMessage( "Admin", "Welcome to the chat!" ) );

        socket.broadcast.to( user.room ).emit( "message", generateMessage( "Admin", `${user.username} has joined the chat` ) );

        io.to( user.room ).emit(
            "roomData",
            {
                "room": user.room,
                "users": getUsersInRoom( user.room ),

            }
        );

        callback();
    } );

    socket.on( "sendMessage", ( message, callback ) => {
        const filter = new Filter();
        const user = getUser( socket.id );

        if( filter.isProfane( message ) ){
            return callback( "Profanity is not allowed" );
        }

        io.to( user.room ).emit( "message", generateMessage( user.username, message ) );

        callback();
    } );

    socket.on( "sendLocation", ( location, callback ) => {
        const user = getUser( socket.id );

        io.to( user.room ).emit( "locationURL", generateMessage( user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}` ) );

        callback();
    } );

    socket.on( "disconnect", () => {
        const user = removeUser( socket.id );

        if( user ){
            io.to( user.room ).emit( "message", generateMessage( "Admin", `${user.username} has left the chat` ) );

            io.to( user.room ).emit(
                "roomData",
                {
                    "room": user.room,
                    "users": getUsersInRoom( user.room ),

                }
            )
        }
    } );
} );

router.get( "/", ( request, response ) => {
    response.send( "index.html" );
} );

module.exports = server;
