import fs from 'fs';
import path from 'path';
import { Observable } from 'rx';
import connect from '../src/db';

const readFile = Observable.fromNodeCallback( fs.readFile );
const readJson = ( ...args ) => readFile( path.join( __dirname, ...args ) )
  .map( contents => JSON.parse( contents ) )
  ;

const MONGO_DB_NAME = 'dev';

let neo, mongo;

const log = function ( ...args ) {
  return this.tap( () => console.log( ...args ) );
};

const conf = {
  mongodb: {
    uri: process.env.MONGO_URI || `mongodb://localhost:27017/${MONGO_DB_NAME}`,
  },

  neo4j: {
    uri: process.env.NEO_URI || 'bolt://localhost',
  },
};

const disconnect = () => {
  mongo.close();
  neo.close();
  neo.disconnect();
};

console.log( 'Connecting to databases...' );
connect( conf )
  .tap( db => {
    neo = db.neo;
    mongo = db.mongo;
  })

  ::log( 'Emptying Mongo...' )
  .flatMap( () => mongo.collection( 'users' ).removeMany({}) )
  .flatMap( () => mongo.collection( 'worlds' ).removeMany({}) )
  .flatMap( () => mongo.collection( 'characters' ).removeMany({}) )
  .flatMap( () => mongo.collection( 'elements' ).removeMany({}) )
  .flatMap( () => mongo.collection( 'genes' ).removeMany({}) )
  .flatMap( () => mongo.collection( 'outlines' ).removeMany({}) )

  ::log( 'Emptying Neo...' )
  .flatMap( () => neo.run([
    'MATCH (n)',
    'OPTIONAL MATCH (n)-[rel]-()',
    'DELETE n, rel',
    'RETURN true', // hack to make sure the observable has something to which to subscribe
  ].join( "\n" )))
  .toArray()

  /**
   * Users
   */
  ::log( 'Loading Users to Mongo...' )
  .flatMap( () => readJson( 'mongo', 'users.json' ) )
  .flatMap( users => mongo.collection( 'users' ).insertMany( users ) )
  .map( result => result.ops )

  ::log( 'Loading Users to Neo...' )
  .flatMap( users => neo.run([
    'UNWIND {users} as user',
    'CREATE (u:User { _id: user._id })',
    'RETURN count(u) as users',
  ].join( "\n" ), { users } ) )

  /**
   * Worlds
   */
  ::log( 'Loading Worlds to Mongo...' )
  .flatMap( () => readJson( 'mongo', 'worlds.json' ) )
  .flatMap( worlds => mongo.collection( 'worlds' ).insertMany( worlds ) )
  .map( result => result.ops )

  ::log( 'Loading Worlds to Neo...' )
  .flatMap( worlds => neo.run([
    'UNWIND {worlds} as world',
    'CREATE (w:World { _id: world._id })',
    'WITH w, world',

    'UNWIND world.owners as uid',
    'MATCH (user:User {_id: uid})',
    'CREATE (user)-[:ROLE {type: "own"}]->(w)',
    'WITH w, world',

    'UNWIND world.writers as uid',
    'MATCH (user:User {_id: uid})',
    'CREATE (user)-[:ROLE {type: "rw"}]->(w)',
    'WITH w, world',

    'UNWIND world.readers as uid',
    'MATCH (user:User {_id: uid})',
    'CREATE (user)-[:ROLE {type: "ro"}]->(w)',
    'WITH w, world',

    'RETURN count(w) as worlds',
  ].join( "\n" ), { worlds } ) )

  /**
   * Characters
   */
  ::log( 'Loading Characters to Mongo...' )
  .flatMap( () => readJson( 'mongo', 'characters.json' ) )
  .flatMap( characters => mongo.collection( 'characters' ).insertMany( characters ) )
  .map( result => result.ops )

  ::log( 'Loading Characters to Neo...' )
  .flatMap( characters => neo.run([
    'UNWIND {characters} as character',
    'CREATE (c:Character { _id: character._id })',
    'WITH character, c',
    'MATCH (w:World {_id: character.world})',
    'CREATE (w)<-[:OF]-(c)',
    'RETURN count(c) as characters',
  ].join( "\n" ), { characters } ) )

  /**
   * Elements
   */
  ::log( 'Loading Elements to Mongo...' )
  .flatMap( () => readJson( 'mongo', 'elements.json' ) )
  .flatMap( elements => mongo.collection( 'elements' ).insertMany( elements ) )
  .map( result => result.ops )

  ::log( 'Loading Elements to Neo...' )
  .flatMap( elements => neo.run([
    'UNWIND {elements} as element',
    'CREATE (e:Element { _id: element._id })',
    'WITH element, e',
    'MATCH (w:World {_id: element.world_id})',
    'CREATE (w)<-[:OF]-(e)',
    'RETURN count(e) as elements',
  ].join( "\n" ), { elements } ) )

  /**
   * Outlines
   */
  ::log( 'Loading Outlines to Mongo...' )
  .flatMap( () => readJson( 'mongo', 'outlines.json' ) )
  .flatMap( outlines => mongo.collection( 'outlines' ).insertMany( outlines ) )
  .map( result => result.ops )

  ::log( 'Loading Outlines to Neo...' )
  .flatMap( outlines => neo.run([
    'UNWIND {outlines} as outline',
    'CREATE (o:Outline { _id: outline._id })',
    'WITH outline, o',
    'MATCH (w:World {_id: outline.world_id})',
    'CREATE (w)<-[:OF]-(o)',
    'RETURN count(o) as outlines',
  ].join( "\n" ), { outlines } ) )

  /**
   * Genes
   */
  ::log( 'Loading Genes to Mongo...' )
  .flatMap( () => readJson( 'mongo', 'genes.json' ) )
  .flatMap( genes => mongo.collection( 'genes' ).insertMany( genes ) )
  .map( result => result.ops )

  ::log( 'Loading Genes to Neo...' )
  .flatMap( genes => neo.run([
    'UNWIND {genes} as gene',
    'CREATE (g:Gene { _id: gene._id })',
    'RETURN count(g) as genes',
  ].join( "\n" ), { genes } ) )

  .toArray()
  .subscribe( () => {
    console.log( 'Success!' );
  }, err => {
    console.log( 'Something went wrong:', err );
    disconnect();
  }, disconnect )
  ;

