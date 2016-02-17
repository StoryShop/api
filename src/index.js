import express from 'express';
import bodyParser from 'body-parser';
import falcorRouter from './falcor';
import api from './api';

const app = express();

app.use( bodyParser.json() );
app.use( '/api', api );
app.use( '/model.json', falcorRouter );

app.get( '/*', function ( req, res ) {
  res.status( 404 ).json({
    code: 404,
    error: 'Not Found',
    message: 'No matching API route',
  });
});

const port = 9999;
app.listen( port, function () {
  console.log( `Listening on port ${port}...` )
});

