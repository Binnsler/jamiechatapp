const server = require( "./app" );

server.listen( process.env.PORT, () => {
    /* eslint-disable no-console */
    console.log( `Server listening on port ${process.env.PORT}` );
} );
