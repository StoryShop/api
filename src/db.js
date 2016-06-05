import { Observable } from 'rx';
import { MongoClient } from 'mongodb';
import Logger from './logger';

const log = Logger( 'DB' );
const connect = Observable.fromNodeCallback( MongoClient.connect, MongoClient );

export default ({ uri }) => {
  log.debug(`connecting to ${uri}`);
  return connect( uri );
};

