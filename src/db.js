import { Observable } from 'rx';
import { MongoClient } from 'mongodb';
import Logger from './logger';

const log = Logger( 'DB' );

export default ({ uri }) => {
  log.debug(`connecting to ${uri}`);
  let connection = null;

  const connect = Observable.fromNodeCallback( function ( uri, cb ) {
    if ( ! connection ) {
      MongoClient.connect( uri, function ( err, conn ) {
        connection = conn;

        cb( err, conn );
      });
    } else {
      cb( null, connection );
    }
  });

  return connect( uri );
};

