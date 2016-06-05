import express from 'express';
import bodyParser from 'body-parser';
import info from '../info';
import falcorRouter from '../falcor';
import connectDb from '../db';
import Logger from '../logger';
import upload from './upload';
import auth from './auth';
import { withUser, isLoggedIn } from './auth/middleware';

const log = Logger( 'ApiRouter' );

const db = connectDb({
  hostname: process.env.MONGO_HOSTNAME || 'localhost',
  port: process.env.MONGO_PORT || 27017,
  env: process.env.MONGO_ENV || 'dev',
});

const router = express.Router();

router.use( '/auth', bodyParser.json(), auth( db ) );
router.use( '/upload', withUser(), isLoggedIn(), upload( db ) );
router.use( '/model.json', withUser(), bodyParser.urlencoded(), falcorRouter( db ) );

router.get( '/', function ( req, res ) {
  log.debug( 'Hello!' );

  return res.json( info() );
});

router.get( '/health', function ( req, res ) {
  db.subscribe( db => res.json({ status: 200, message: 'good health' }), err => {
    log.debug( 'Error connecting to DB' );
    log.debug( err.stack || err );

    res.status( 500 ).json({
      status: 500,
      message: `could not connect to db: ${err}`,
    });
  });
});

export default router;

