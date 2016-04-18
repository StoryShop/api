import { Observable } from 'rx';
import { keys, $ref } from '../../utils';
import {
  toPathValues,
  withComponentCounts,
  create,
  pushToArray,
} from './../transforms';
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
    /**
     * Properties
     */
    {
      route: 'worldsById[{keys:ids}]["_id", "title", "slug", "colour"]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, f ], pathSet[ 2 ] ) )
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

    /**
     * Access control
     */
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

    /**
     * Characters
     */
    {
      route: 'worldsById[{keys:ids}].characters[{integers:indices}]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( withCharacterRefs( pathSet.indices ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, 'characters', i.idx ], 'ref' ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].characters.push',
      call: ( { ids: [ id ] }, [ name = 'Unnamed Character' ] ) => db
        .flatMap( getWorlds( [ id ], user ) )
        .flatMap( ({ readers = [], writers = [], owners = [], _id }) => db.flatMap(
          create( 'characters', { name, readers, writers: writers.concat( owners ) }) 
        ))
        .flatMap( character => {
          const charPV = toPathValues( ( i, f ) => [ 'charactersById', i._id, f ] )( character );
          const worldPV = db
            .flatMap( pushToArray( 'worlds', user, [ id ], 'characters', character._id ) )
            .flatMap( toPathValues( ( i, f ) => [ 'worldsById', id, 'characters', f ] ) )
            ;

          return Observable.from([ charPV, worldPV ])
            .selectMany( o => o )
            ;
        })
        ,
    },

    /**
     * Outlines
     */
    {
      route: 'worldsById[{keys:ids}].outlines[{integers:indices}]',
      get: pathSet => db
        .flatMap( getWorlds( pathSet.ids, user ) )
        .flatMap( withOutlineRefs( pathSet.indices ) )
        .flatMap( toPathValues( ( i, f ) => [ 'worldsById', i._id, 'outlines', i.idx ], 'ref' ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].outlines.push',
      call: ( { ids: [ id ] }, [ title = 'Unnamed Outline' ] ) => db
        .flatMap( getWorlds( [ id ], user ) )
        .flatMap( ({ readers = [], writers = [], owners = [], _id }) => db.flatMap(
          create( 'outlines', { title, readers, writers: writers.concat( owners ) }) 
        ))
        .flatMap( outline => {
          const charPV = toPathValues( ( i, f ) => [ 'outlinesById', i._id, f ] )( outline );
          const worldPV = db
            .flatMap( pushToArray( 'worlds', user, [ id ], 'outlines', outline._id ) )
            .flatMap( toPathValues( ( i, f ) => [ 'worldsById', id, 'outlines', f ] ) )
            ;

          return Observable.from([ charPV, worldPV ])
            .selectMany( o => o )
            ;
        })
        ,
    },

    /**
     * Elements
     */
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
    {
      route: 'worldsById[{keys:ids}].elements.push',
      call: ( { ids: [ id ] }, [ element ] ) => db
        .flatMap( getWorlds( [ id ], user ) )
        .flatMap( ({ readers = [], writers = [], owners = [], _id }) => db.flatMap(
           create( 'elements', {
             ...element,
             world_id: _id,
             readers,
             writers: writers.concat( owners ),
           })
        ))
        .flatMap( element => {
          const charPV = toPathValues( ( i, f ) => [ 'elementsById', i._id, f ] )( element );
          const worldPV = db
            .flatMap( getWorlds( [ id ], user ) )
            .flatMap( world => db.flatMap( getElementCount( world ) ) )
            .map( ({ elements: length }) => ({
              length,
              [length]: $ref([ 'elementsById', element._id ]),
            }))
            .flatMap( toPathValues( ( i, f ) => [ 'worldsById', id, 'elements', f ] ) )
            ;

          return Observable.from([ charPV, worldPV ])
            .selectMany( o => o )
            ;
        })
        ,
    },
  ];
};

