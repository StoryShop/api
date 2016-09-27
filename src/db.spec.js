import test from 'tape';

import database from './db';

const dbconf = {
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dev',
  },

  neo4j: {
    uri: process.env.NEO_URI || 'bolt://localhost',
  },
};

test( 'MongoDB', t => {
  const db = database( dbconf, true );
  let neo, mongo;

  db
    .map( db => {
      neo = db.neo;
      mongo = db.mongo;

      return mongo;
    })
    .flatMap( mongo => mongo.collections() )
    .subscribe( coll => {
      t.ok( Array.isArray( coll ), 'should get a list of collections from mongo' );
      t.end();

      mongo.close().then( () => neo.close( () => neo.disconnect() ));
    });
});

test( 'Neo4j', t => {
  const db = database( dbconf, true );
  let neo, mongo, actual, expected;

  db
    .map( db => {
      neo = db.neo;
      mongo = db.mongo;

      return neo;
    })
    .flatMap( neo => neo.run( 'MATCH (n) RETURN count(n) as num' ) )
    .subscribe( res => {
      const num = res.get( 'num' ).toInt();

      expected = 'number';
      actual = typeof num;
      t.equal( actual, expected, 'should return a count from the db' );

      t.end();

      mongo.close().then( () => neo.close( () => neo.disconnect() ));
    });
});

