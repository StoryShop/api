import { keys } from '../../utils';
import { toPathValues, withComponentCounts } from './../transforms';
import {
  getWorlds,
  setWorldProps,
  withCharacterRefs,
  withOutlineRefs,
} from './../transforms/worlds';
import {
  getElementCount,
  getElementsForWorld,
} from '../transforms/elements';

export default ( db, req, res ) => {
  const { user } = req;

  return [
    {
      route: 'worldsById[{keys:ids}]["_id", "title", "slug", "colour"]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, f ], pathSet[ 2 ] ) )
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
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, f ], 'rights' ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}]["title", "slug", "colour"]',
      set: pathSet => db
        .flatMap( setWorldProps( pathSet.worldsById, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, f ], i => keys( pathSet.worldsById[ i._id ] ) ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}]["outlines","characters"].length',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( withComponentCounts( pathSet[ 2 ] ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, f, 'length' ], pathSet[ 2 ] ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].characters[{integers:indices}]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( withCharacterRefs( pathSet.indices ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, 'characters', i.idx ], 'ref' ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].outlines[{integers:indices}]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( withOutlineRefs( pathSet.indices ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, 'outlines', i.idx ], 'ref' ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].elements.length',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( world => db.flatMap( getElementCount( world ) ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, f, 'length' ], 'elements' ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].elements[{integers:indices}]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( world => db.flatMap( getElementsForWorld( world, pathSet.indices ) ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, 'elements', i.idx ], 'ref' ) )
        ,
    },
  ];
};

