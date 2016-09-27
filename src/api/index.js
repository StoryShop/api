import { Observable } from 'rx';
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
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dev',
  },

  neo4j: {
    uri: process.env.NEO_URI || 'bolt://localhost',
  },
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
  const handleError = err => {
    log.debug( 'Error connecting to DB' );
    log.debug( err.stack || err );

    res.status( 500 ).json({
      status: 500,
      message: `could not connect to database: ${err}`,
    });
  };

  db.subscribe( ({ mongo, neo }) => {
    neo.run( 'MATCH (n) RETURN count(n) as cnt' )
      .toArray()
      .subscribe( records => {
        res.json({ status: 200, message: 'good health' });
        neo.close();
      }, handleError )
  }, handleError );
});

export default router;

