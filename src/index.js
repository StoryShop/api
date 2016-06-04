import express from 'express';
import cors from 'cors';
import api from './api';
import conf from './config';

const app = express();

app.use( cors({
  origin: /.*/,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.options( '*', cors() );
app.use( '/api', api );

app.get( '/*', function ( req, res ) {
  res.status( 404 ).json({
    code: 404,
    error: 'Not Found',
    message: 'No matching API route',
  });
});

app.listen( conf.server.port, function () {
  console.log( `Listening on port ${conf.server.port}...` )
});

