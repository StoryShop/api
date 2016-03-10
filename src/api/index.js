import express from 'express';
import bodyParser from 'body-parser';
import info from '../info';
import falcorRouter from '../falcor';
import connectDb from '../db';
import Logger from '../logger';
import upload from './upload';

const log = Logger( 'ApiRouter' );

const db = connectDb({
  hostname: process.env.MONGO_HOSTNAME || 'localhost',
  port: process.env.MONGO_PORT || 27017,
  env: process.env.MONGO_ENV || 'dev',
});

const router = express.Router();

/**
 * Mock out an authenticated user
 */
router.use( function ( req, res, next ) {
  req.user = {
    _id: "EJA_S0Cie",
  };

  next();
});

router.use( '/model.json', bodyParser.urlencoded(), falcorRouter( db ) );

router.use( '/upload', upload( db ) );

router.get( '/', function ( req, res ) {
  log.debug( 'Hello!' );

  const sendError = () => res.status( 500 ).json({
    status: 500,
    error: 'Internal Server Error',
    message: 'Could not connect to database.',
  });

  db
    .then( db => {
      db.collection( 'worlds' ).find({}).toArray( ( err, docs ) => {
        if ( err ) {
          return sendError();
        }

        return res.json( info() );
      })
    })
    .catch( err => {
      log.error( err );
      return sendError();
    })
    ;
});

export default router;

