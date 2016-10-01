import test from 'tape';
import {Observable} from 'rx';
import database from '../../db';
import {
  getBooks,
  getBooksLength,
  permissionBook
} from './books'

const dbconf = {
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dev',
  },

  neo4j: {
    uri: process.env.NEO_URI || 'bolt://localhost',
  },
};

const populate = `
  CREATE (reader:User {  _id:"testUser1" }) 
  CREATE (user:User {  _id:"testUser" }) 
  CREATE (world:World {_id: "testWorld"})<-[:OWNER {archived: false}]-(user) 
  CREATE (world)<-[:READER {archived: false}]-(reader) 
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

const books = [
  {_id: 'testBook', title: 'Book for test'},
  {_id: 'testBook1', title: 'Book for test2'},
];

const bookIds = books.map(book => book._id);

test('permissionBook', t => {
  const db = database(dbconf);
  let neo, mongo, actual, expected;
  let book = 'testBook';
  let owner = 'testUser';
  let reader = 'testUser1'

  db
    .map(db => {
      neo = db.neo;
      mongo = db.mongo;
      return neo;
    })
    .flatMap(neo =>
      neo.run(populate)
    )
    .flatMap(neo =>
      db::permissionBook(book, owner)
    )
    .flatMap(permission => {

      actual = permission;
      expected = true;
      t.equals(actual, expected, "should have permission to read the book");


      return db::permissionBook(book, owner, true)
    })
    .flatMap(permission => {

      actual = permission;
      expected = true;
      t.equals(actual, expected, "should have permission to modify the book");

      return db::permissionBook(book, reader, true)
    })
    .flatMap(permission => {

      actual = permission;
      expected = false;
      t.equals(actual, expected, "should not have permission to modify the book");

      return neo.run(remove);
    })
    .subscribe(() => {
      mongo.close().then(() => neo.close(() => neo.disconnect()));
      t.end();
    })
});

test('getBooks', t => {
  const db = database(dbconf);
  let neo, mongo, actual, expected;
  let booksToFind = ["testBook", "testBook1"];
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
      mongo.collection('books').insertMany(books)
    )
    .flatMap(neo =>
      db::getBooks(booksToFind, userId)
    )
    .flatMap((book) => {

      actual = bookIds.find(id => book._id) != null;
      expected = true;
      t.equals(actual, expected, 'should match one of the ids that has been passed to getBooks');

      return neo.run(remove)
    })

    .flatMap(() => {
      //t.throws(() => db::getBooks(['invalidID'], userId), 'should throw an exception');
      return mongo.collection('books').removeMany({_id: {$in: bookIds}})
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


test('getBooksLength', t => {
  const db = database(dbconf);
  let neo, mongo, actual, expected;

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
      db::getBooksLength('testWorld')
    )
    .flatMap(length => {

      actual = length;
      expected = 2;
      t.equals(actual, expected, "should match the number of books the world has");

      return neo.run(remove);
    })
    .flatMap(() =>
      db::getBooksLength('invalidWorld')
    )
    .flatMap(length => {

      actual = length;
      expected = 0;
      t.equals(actual, expected, "should not have any book when the world is not valid");

      return neo.run(remove);
    })
    .subscribe(() => {
      mongo.close().then(() => neo.close(() => neo.disconnect()));
      t.end();
    })
});

