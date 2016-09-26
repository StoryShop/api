import test from 'tape';

import database from '../../db';
import {
  archiveNode,
  archiveRelationship
} from './index'

const dbconf = {
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dev',
  },

  neo4j: {
    uri: process.env.NEO_URI || 'bolt://localhost',
  },
};

const populate =  `
  CREATE (user:User {  _id:"testUser" }) 
  CREATE (world:World {_id: "testWorld"})<-[:Owner {archived: false}]-(user) 
  CREATE (a:Book {_id : "testBook"})-[:IN {archived: false}]->(world) 
  CREATE (b:Book {_id: "testBook1" })-[:IN {archived: false}]->(world)
  CREATE (:Book {_id: "testBookAlone"})
  return user
  `;
const remove = `
    MATCH (n)
    OPTIONAL MATCH (n)-[r]-()
    WITH n,r LIMIT 50000
    WHERE n._id =~ ".*test.*"
    DELETE n,r
    RETURN count(n) as deletedNodesCount
  `;

test( 'archiveNode', t => {
  const db = database( dbconf );
  let nodeToArchive = 'testWorld';
  const nodeLabel = 'World';
  const userId = 'testUser';
  let neo, mongo, actual, expected;

  db
    .map( db => {
      neo = db.neo;
      mongo = db.mongo;
      return neo;
    })
    .flatMap( neo =>
      neo.run(populate)
    )
    .flatMap((e) =>
      db::archiveNode(nodeLabel, nodeToArchive, userId)
    )
    .flatMap(record => {
      expected = true;
      actual = record._fields[0].properties.archived;
      t.equals(actual, expected, 'should be archived');

      expected = userId;
      actual = record._fields[0].properties.archiver;
      t.equals(actual, expected, 'should match the userId that has been passed to archiveNode');


      return neo.run('MATCH (s)<-[r]-(e) WHERE s._id = {nodeToArchive} AND r.archived=true RETURN r',{nodeToArchive});
    })
    .toArray()
    .flatMap(array => {

      expected = 3;
      actual = array.length;
      t.equals(actual, expected, 'should have his relationships archived');

      return neo.run(remove);
    })
    .subscribe( () => {
      mongo.close().then( () => neo.close( () => neo.disconnect() ));
      t.end();
    })
});

test( 'archiveRelationship', t => {
  const db = database( dbconf );
  const relType = 'IN';
  const fromNodeId = 'testBook';
  const toNodeId = 'testWorld';
  const userId = 'testUser';
  let neo, mongo, actual, expected;

  db
    .map( db => {
      neo = db.neo;
      mongo = db.mongo;
      return neo;
    })
    .flatMap( neo =>
      neo.run(populate)
    )
    .flatMap((e) =>
      db::archiveRelationship(relType,fromNodeId,toNodeId, userId)
    )
    .flatMap(record => {

      expected = true;
      actual = record._fields[0].properties.archived;
      t.equals(actual, expected, 'should be archived');

      expected = userId;
      actual = record._fields[0].properties.archiver;
      t.equals(actual, expected, 'should match the userId that has been passed to archiveRelationship')


      return neo.run(remove);
    })
    .subscribe( () => {
      mongo.close().then( () => neo.close( () => {neo.disconnect()} ));
      t.end();
    })
});


