import test from 'tape';

import database from '../../db';
import {archiveDocument} from './index'
import {generateId} from '../../utils'

const dbconf = {
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dev',
  },

  neo4j: {
    uri: process.env.NEO_URI || 'bolt://localhost',
  },
};

test( 'archiveDocument', t => {
  const db = database( dbconf );
  const worldA = {_id: generateId(),title: "Test World A"};
  const worldB = {_id: generateId(),title: "Test World B"};
  const invalidWorld = {_id: generateId(),title: "Invalid world"};
  const userId = "testingId";
  const collection = 'world';
  let neo, mongo, actual, expected;

  db
    .map( db => {
      neo = db.neo;
      mongo = db.mongo;
      return mongo;
    })
    .flatMap( mongo => {
      return mongo.collection(collection).insertMany( [worldA,worldB] )
    })
    .flatMap( () => {
      return db::archiveDocument(collection,worldA._id,userId)
    })
    .flatMap( document => {

      expected = worldA._id;
      actual = document._id;
      t.equal(actual, expected,'should have the same _id that has been passed to archiveDocument');

      expected = userId;
      actual = document.archiver;
      t.equal(actual, expected,'should match the userId that has been passed to archiveDocument');

      expected = true;
      actual = document.archived;
      t.equal(actual, expected,'should be archived')

      return mongo.collection(collection).findOne({_id : worldB._id})
    })
    .flatMap(document => {

      expected = worldB;
      actual = document;
      t.deepEqual(actual, expected,'should not change when the _id does not match the document _id');

      return mongo.collection(collection).deleteMany(
        {
          _id : { $in: [worldA._id,worldB._id]}
        }
      )
    })
    .flatMap(r =>
      db::archiveDocument(collection,invalidWorld._id,userId)
    )
    .subscribe((document) => {

      expected = null;
      actual = document;
      t.equal(actual, expected,'should not exist when the document is invalid');

      t.end();

      mongo.close().then( () => neo.close( () => neo.disconnect() ));
    })
});

