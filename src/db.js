import { MongoClient } from 'mongodb';
import Logger from './logger';

const log = Logger( 'DB' );

export default conf => new Promise( ( resolve, reject ) => {
  const url = `mongodb://${conf.hostname}:${conf.port}/${conf.env}`;

  log.debug(`connecting to ${url}`);

  MongoClient.connect( url, ( err, db ) => {
    if ( err ) {
      return reject( err );
    }

    return resolve( db );
  });
});

