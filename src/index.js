import express from 'express';
import bodyParser from 'body-parser';

const app = express();

app.use( bodyParser.json() );

app.get( '/*', function ( req, res ) {
  res.json({
    hello: 'world',
  });
});

const port = 9999;
app.listen( port, function () {
  console.log( `Listening on port ${port}...` )
});

