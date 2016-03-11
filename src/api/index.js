import express from 'express';
import bodyParser from 'body-parser';
import info from '../info';
import falcorRouter from '../falcor';
import connectDb from '../db';
import Logger from '../logger';
import upload from './upload';
import auth from './auth';
import PassportFactory from './auth/passport';

const log = Logger( 'ApiRouter' );

const db = connectDb({
  hostname: process.env.MONGO_HOSTNAME || 'localhost',
  port: process.env.MONGO_PORT || 27017,
  env: process.env.MONGO_ENV || 'dev',
});

const passport = PassportFactory( db );
const router = express.Router();

router.use( passport.initialize() );

router.use( '/auth', auth( db ) );
router.use( '/upload', upload( db ) );
router.use( '/model.json', bodyParser.urlencoded(), falcorRouter( db ) );

router.get( '/', function ( req, res ) {
  log.debug( 'Hello!' );

  const sendError = () => res.status( 500 ).json({
    status: 500,
    error: 'Internal Server Error',
    message: 'Could not connect to database.',
  });

  db
    .subscribe( db => {
      db.collection( 'worlds' ).find({}).toArray( ( err, docs ) => {
        if ( err ) {
          return sendError();
        }

        return res.json( info() );
      })
    }, err => {
      log.error( err );
      return sendError();
    })
    ;
});

export default router;

