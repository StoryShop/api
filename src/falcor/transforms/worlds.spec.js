import test from 'tape';
import {Observable} from 'rx';
import database from '../../db';
import {
  getBooksFromWorld,
  createBook,
  permissionWorld,
  getWorldsNext
} from './worlds'

const dbconf = {
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dev',
  },

  neo4j: {
    uri: process.env.NEO_URI || 'bolt://localhost',
  },
};

const populate =  `
  CREATE (reader:User {  _id:"testUser1" }) 
  CREATE (user:User {  _id:"testUser" }) 
  CREATE (world:World {_id: "testWorld"})<-[:OWNER {archived: false}]-(user) 
  CREATE (world)<-[:READER]-(reader)
  CREATE (:Book {_id : "testBook"})-[:IN {archived: false}]->(world) 
  CREATE (:Book {_id: "testBook1" })-[:IN {archived: false}]->(world)
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


test( 'getBooksFromWorld', t => {
  const db = database( dbconf );
  let neo, mongo, actual, expected;
  let world = 'testWorld';
  let validUser = 'testUser';
  let invalidUser = 'testUser1';
  let validBooks = ['testBook','testBook1'];

  db
    .map( db => {
      neo = db.neo;
      mongo = db.mongo;
      return neo;
    })
    .flatMap( neo =>
      neo.run(populate)
    )
    .flatMap( neo =>
      db::getBooksFromWorld(world,validUser)
    )
    .map((book) => {

      actual = validBooks.find(id => book) != null;
      expected = true;
      t.equals(actual, expected, 'should have an id which matches one book in the world');

      return book;
    })
    .last()
    .flatMap(() => {
      return neo.run(remove);
    })
    .subscribe(
      () => {
        mongo.close().then(() => neo.close(() => neo.disconnect()));
        t.end();
      },
      error => {
        mongo.close().then(() => neo.close(() => neo.disconnect()));
      }
    )
});


test( 'createBook', t => {
  const db = database(dbconf);
  let neo, mongo, actual, expected;
  let worldId = 'testWorld';
  let bookTitle = 'Test Book';
  let user = 'testUser';

  db
    .map( db => {
      neo = db.neo;
      mongo = db.mongo;
      return neo;
    })
    .flatMap( neo =>
      neo.run(populate)
    )
    .flatMap(() => {
      return db::createBook(worldId,bookTitle,user)
    })
    .flatMap(book => {

      actual = book.title;
      expected = bookTitle;
      t.equals(actual, expected, 'should have the same title that has been passed to createBook');

      actual = book.created_at;
      t.ok(actual, 'should have a "created_at" property');

      actual = book.updated_at;
      t.ok(actual, 'should have a "updated_at" property');

      return Observable.fromPromise(mongo.collection('books').deleteOne({_id: book._id}))
        .flatMap(() => {
          return neo.run('MATCH (n:Book {_id: {bookId}})-[r:IN]->(w:World) return r as rel',{bookId: book._id})
        })
    })
    .flatMap(record => {
      const relationship = record.get('rel');

      actual = relationship.type;
      expected = 'IN';
      t.equals(actual, expected, 'should have a relationship type = IN');

      actual = relationship.properties.archived;
      expected = false;
      t.equals(actual, expected, 'should not be archived');

      actual = relationship.properties.created_at;
      t.ok(actual, 'should have a "created_at" property');

      actual = relationship.properties.creator;
      t.ok(actual, 'should have a "creator" property');

      return neo.run(remove);
    })
    .subscribe(
      () => {
        mongo.close().then(() => neo.close(() => neo.disconnect()));
        t.end();
      },
      error => {
        mongo.close().then(() => neo.close(() => neo.disconnect()));
      }
    )
});

test( 'permissionWorld', t => {
  const db = database(dbconf);
  let neo, mongo, actual, expected;
  let worldId = 'testWorld';
  let owner = 'testUser';
  let reader = 'testUser1';

  db
    .map( db => {
      neo = db.neo;
      mongo = db.mongo;
      return neo;
    })
    .flatMap( neo =>
      neo.run(populate)
    )
    .flatMap(() =>
      db::permissionWorld(worldId,owner,true)
    )
    .flatMap(permission => {

      actual = permission;
      expected = true;
      t.equals(actual, expected, 'should have permission to write in the world ');

      return db::permissionWorld(worldId,reader,true)

    })
    .flatMap(permission => {
      actual = permission;
      expected = false;
      t.equals(actual, expected, 'should not have permission to write in the world ');

      return db::permissionWorld(worldId, reader, false)
    })
    .flatMap(permission => {

      actual = permission;
      expected = true;
      t.equals(actual, expected, 'should have permission to read in the world ');

      return neo.run(remove);
    })
    .subscribe(
      () => {
        mongo.close().then(() => neo.close(() => neo.disconnect()));
        t.end();
      },
      error => {
        console.log(error);
        mongo.close().then(() => neo.close(() => neo.disconnect()));
      }
    )
});

test('getWorldsNext', t => {
  const db = database(dbconf);
  let neo, mongo, actual, expected;
  const worldsToInsert = [
    {_id: 'testWorld', title: 'testWorld'},
    {_id: 'testWorld2', title: 'testWorld2'}
  ];
  const worldIds = worldsToInsert.map((world) => world._id);

  const worldAssigned = 'testWorld';
  let userId = 'testUser';


  db
    .map(db => {
      neo = db.neo;
      mongo = db.mongo;
      return neo;
    })
    .flatMap(neo =>
      neo.run(populate)
    )
    .flatMap(() =>
      mongo.collection('worlds').insertMany(worldsToInsert)
    )
    .flatMap(neo =>
      db::getWorldsNext([worldAssigned], userId, true)
    )
    .flatMap((world) => {

      actual = world._id;
      expected = 'testWorld';
      t.equals(actual, expected, 'should have one world assigned');

      return neo.run(remove)
    })

    .flatMap(() => {
      return mongo.collection('worlds').removeMany({_id: {$in: worldIds}})
    })
    .subscribe(
      () => {
        mongo.close().then(() => neo.close(() => neo.disconnect()));
        t.end();
      },
      error => {
        mongo.close().then(() => neo.close(() => neo.disconnect()));
      }
    )
});





