import { keys } from '../../utils';
import { toPathValues, withComponentCounts } from './../transforms';
import {
  getWorlds,
  setWorldProps,
  withCharacterRefs,
} from './../transforms/worlds';

export default ( db, req, res ) => {
  const { user } = req;

  return [
    {
      route: 'worldsById[{keys:ids}]["_id", "title", "slug", "colour"]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( toPathValues( pathSet[ 2 ], ( i, f ) => [ 'worldsById', i._id, f ] ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].rights',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .map( world => {
          const rights = [];

          if ( world.owners.indexOf( user._id ) !== -1 ) {
            rights.push( 'A' );
          }

          if ( world.readers.indexOf( user._id ) !== -1 ) {
            rights.push( 'R' );
          }

          if ( world.writers.indexOf( user._id ) !== -1 ) {
            rights.push( 'W' );
          }

          return { _id: world._id, rights };
        })
        .flatMap( toPathValues( 'rights', ( i, f ) => [ 'worldsById', i._id, f ] ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}]["title", "slug", "colour"]',
      set: pathSet => db
        .flatMap( setWorldProps( pathSet.worldsById, user ) )
        .flatMap( toPathValues( i => keys( pathSet.worldsById[ i._id ] ), ( i, f ) => [ 'worldsById', i._id, f ] ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}]["elements","outlines","characters"].length',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( withComponentCounts( pathSet[ 2 ] ) )
        .flatMap( toPathValues( pathSet[ 2 ], ( i, f ) => [ 'worldsById', i._id, f, 'length' ] ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].characters[{integers:indices}]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( withCharacterRefs( pathSet.indices ) )
        .flatMap( toPathValues( 'ref', ( i, f ) => [ 'worldsById', i._id, 'characters', i.idx ] ) )
        ,
    },
  ];
};

