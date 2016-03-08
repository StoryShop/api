import express from 'express';
import cors from 'cors';
import api from './api';

const app = express();

app.use( cors({
  origin: /.*/,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use( '/api', api );

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

