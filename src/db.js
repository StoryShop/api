import { Observable } from 'rx';
import { MongoClient } from 'mongodb';
import { driver } from 'neo4j-driver/lib/v1';
import Logger from './logger';

const log = Logger( 'Database' );

export default ({ mongodb, neo4j }) => {
  log.debug( 'Connecting to databases...' );
  let mongo = null;
  let neo = null;

  const getDb = () => ({
    mongo,
    neo: {
      run ( ...args ) {
        if ( ! this.session ) {
          this.session = neo.session();
        }

        // convert the neo4j run function's Result into an Observable.
        return new Observable( sub => {
          this.session.run( ...args ).subscribe({
            onNext: ( ...args ) => sub.next( ...args ),
            onError: ( ...args ) => sub.error( ...args ),
            onCompleted: ( ...args ) => sub.completed( ...args ),
          });
        });
      },

      close ( ...args ) {
        if ( ! this.session ) {
          return;
        }

        this.session.close( ...args );
        delete this.session;
      },

      disconnect ( ...args ) {
        return neo.close( ...args );
      },
    },
  });

  const connect = Observable.fromNodeCallback( function ( muri, nuri, cb ) {
    if ( ! mongo ) {
      MongoClient.connect( muri, function ( err, conn ) {
        mongo = conn;

        if ( err ) {
          return cb( err );
        }

        neo = driver( nuri );

        cb( err, getDb() );
      });
    } else {
      cb( null, getDb() );
    }
  });

  return connect( mongodb.uri, neo4j.uri );
};


