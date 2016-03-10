import { Observable } from 'rx';
import { MongoClient } from 'mongodb';
import Logger from './logger';

const log = Logger( 'DB' );
const connect = Observable.fromNodeCallback( MongoClient.connect, MongoClient );

export default conf => {
  const url = `mongodb://${conf.hostname}:${conf.port}/${conf.env}`;

  log.debug(`connecting to ${url}`);
  return connect( url );
};

