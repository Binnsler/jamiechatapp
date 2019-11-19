const socket = io();

const $messageForm = document.querySelector( "form" );
const $messageFormInput = $messageForm.querySelector( "input" );
const $messageFormButton = $messageForm.querySelector( "button" );
const $locationButton = document.querySelector( "#sendLocation" );
const $messages = document.querySelector( "#messages" );
const $sidebar = document.querySelector( "#sidebar" );

// Templates
messageTemplate = document.querySelector( "#messageTemplate" ).innerHTML;
locationTemplate = document.querySelector( "#locationTemplate" ).innerHTML;
sidebarTemplate = document.querySelector( "#sidebarTemplate" ).innerHTML;

// Options
const { username, room } = Qs.parse( location.search, { "ignoreQueryPrefix": true } );
const autoscroll = () => {
    const $newMessage = $messages.lastElementChild;
    const newMessageStyles = getComputedStyle( $newMessage );
    const newMessageMargin = parseInt( newMessageStyles.marginBottom );
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if( containerHeight - newMessageHeight <= scrollOffset ){
        $messages.scrollTop = $messages.scrollHeight;
    }
};

$messageForm.addEventListener( "submit", ( event ) => {
    var message = event.target.elements.sendMessage.value;

    event.preventDefault();

    $messageFormButton.disabled = "disabled";

    socket.emit( "sendMessage", message, ( error ) => {
        if( error ){
            /* eslint-disable no-console */
            console.log( "ERROR:", error );
        }
        else{
            /* eslint-disable no-console */
            console.log( "Message delivered" );
        }

        $messageFormButton.removeAttribute( "disabled" );
        $messageFormInput.value = "";
        $messageFormInput.focus();
    } );
} );

socket.on( "message", ( message ) => {
    const html = Mustache.render( messageTemplate, {
        "username": message.username,
        "message": message.text,
        "createdAt": moment( message.createdAt ).format( "h:mm a" )
    } );

    /* eslint-disable no-console */
    console.log( "message", message );

    $messages.insertAdjacentHTML( "beforeEnd", html );

    autoscroll();
} );

socket.on( "locationURL", ( message ) => {
    const html = Mustache.render( locationTemplate, {
        "username": message.username,
        "url": message.text,
        "createdAt": moment( message.createdAt ).format( "h:mm a" )
    } );

    $messages.insertAdjacentHTML( "beforeEnd", html );

    autoscroll();
} );

socket.on( "roomData", ( { room, users} ) => {
    const html = Mustache.render( sidebarTemplate, {
        "room": room,
        "users": users
    } );

    $sidebar.innerHTML = html;
} );

document.querySelector( "#sendLocation" ).addEventListener( "click", () => {
    $locationButton.disabled = "disabled";

    if( !navigator.geolocation ){
        return alert( "Geolocation is not supported by your browser" );
    }

    navigator.geolocation.getCurrentPosition(
        ( position ) => {
            socket.emit(
                "sendLocation",
                {
                    "latitude": position.coords.latitude,
                    "longitude": position.coords.longitude
                },
                () => {
                    $locationButton.removeAttribute( "disabled" );

                    /* eslint-disable no-console */
                    console.log( "Location delivered" );
                }
            );
        }
    );
} );

socket.emit(
    "join",
    {
        "username": username,
        "room": room
    },
    ( error ) => {
        if( error ){
            alert( error );

            location.href = "/";
        }
    }
);
