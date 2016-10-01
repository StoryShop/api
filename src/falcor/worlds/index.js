import { Observable } from 'rx';
import { keys, $ref } from '../../utils';
import {

  toPathValues,
  withComponentCounts,
  create,
  pushToArray,
  getProps,
  setProps,
  remove,
  withLastAndLength,
  addIndex,
  archiveDocument,
  archiveNode,
  archiveRelationship,
} from './../transforms';
import {
  getWorlds,
  getWorldsNext,
  setWorldProps,
  withCharacterRefs,
  withOutlineRefs,
  getBooksFromWorld,
  createBook
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
        ::getWorlds( pathSet.ids, user )
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, f ], pathSet[ 2 ] )
        ,
    },
    {
      route: 'worldsById[{keys:ids}]["title", "slug", "colour"]',
      set: pathSet => db
        ::setWorldProps( pathSet.worldsById, user )
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, f ], i => keys( pathSet.worldsById[ i._id ] ) )
        ,
    },
    {
      route: 'worldsById[{keys:ids}]["outlines","characters"].length',
      get: pathSet => db
        ::getWorlds( pathSet.ids, user )
        .flatMap( withComponentCounts( pathSet[ 2 ] ) )
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, f, 'length' ], pathSet[ 2 ] )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].labels',
      get: pathSet => Observable.from( pathSet.ids )
        .flatMap( _id => {
          return db
            .map( db => db.mongo.collection( 'elements' ) )
            .flatMap( db => db.distinct( 'tags', {
              world_id: { $in: pathSet.ids },
              $or: [
                { writers: { $eq: user._id } },
                { readers: { $eq: user._id } },
              ],
            }))
            .map( tags => ({ _id, tags }))
            ;
        })
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, 'labels' ], 'tags' )
    },

    /**
     * Access control
     */
    {
      route: 'worldsById[{keys:ids}].rights',
      get: pathSet => db
        ::getWorlds( pathSet.ids, user )
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
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, f ], 'rights' )
        ,
    },

    /**
     * Characters
     */
    {
      route: 'worldsById[{keys:ids}].characters[{integers:indices}]',
      get: pathSet => db
        ::getWorlds( pathSet.ids, user )
        .flatMap( withCharacterRefs( pathSet.indices ) )
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, 'characters', i.idx ], 'ref' )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].characters.push',
      call: ( { ids: [ id ] }, [ name = 'Unnamed Character' ] ) => db
        ::getWorlds( [ id ], user )
        .flatMap( ({ readers = [], writers = [], owners = [], _id }) => db::create( 'characters', {
          name,
          readers,
          writers: writers.concat( owners ),
        }))
        .flatMap( character => {
          const charPV = Observable.of( character )
            ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f ] )
            ;
          const worldPV = db
            ::pushToArray( 'worlds', user, [ id ], 'characters', character._id )
            ::withLastAndLength( i => $ref([ 'charactersById', i ]) )
            ::toPathValues( ( i, f ) => [ 'worldsById', id, 'characters', f ] )
            ;

          return Observable.from([ charPV, worldPV ])
            .selectMany( o => o )
            ;
        })
        ,
    },
    {
      route: 'worldsById[{keys:ids}].characters.delete',
      call: ( { ids: [ world_id ] }, [ id ] ) => db
        ::getProps( 'worlds', [ world_id ], user )
        .flatMap( world => {
          const { characters } = world;
          const idx = characters.indexOf( id );

          if ( idx < 0 ) {
            throw new Error( 'Could not find character to delete.' );
          }

          characters.splice( idx, 1 );
          const length = characters.length;

          return db::setProps( 'worlds', { [world_id]: { characters } }, user )
            .flatMap( () => db::remove( 'characters', user, id ) )
            .flatMap( count => {
              if ( ! count ) {
                throw new Error( 'Could not delete character.' );
              }

              return [
                {
                  path: [ 'charactersById', id ],
                  invalidated: true,
                },
                {
                  path: [ 'worldsById', world_id, 'characters', 'length' ],
                  value: length,
                },
                {
                  path: [ 'worldsById', world_id, 'characters', { from: idx, to: length } ],
                  invalidated: true,
                },
              ];
            })
            ;
        })
        ,
    },


    /**
     * Books
     */
    {
      route: 'worldsById[{keys:ids}].books[{integers:indices}]',
      get: ({ids, indices}) =>  db
        ::getWorldsNext(ids, user._id)
        .flatMap(world => db::getBooksFromWorld(world._id, user._id)
          .toArray()
          .flatMap(books => indices
            .map(index => {
              const book = books[index];
              return book != null
                ? [{path: ["worldsById", world._id, "books", index], value: $ref(['booksById', book])}]
                : [{path: ["worldsById", world._id, "books", index], value: null}]
            })
          )
        )
    },
    {
      route: 'worldsById[{keys:ids}].books.length',
      get: ({ids}) => {
        return db
          ::getWorldsNext(ids, user._id)
          .flatMap(world => {
            return db::getBooksFromWorld(world._id, user._id).count()
              .flatMap(count => {
                return [
                  {path: ["worldsById", world._id, "books", "length"], value: count},
                ]
              })
          })
      }
    },
    {
      route: 'worldsById[{keys:ids}].books.push',
      call: ( { ids: [ id ] }, [ {title} ] ) => {
        return db
          ::getWorldsNext([id], user._id)
          .flatMap(world => db
            ::createBook(world._id, title, user._id)
            .flatMap(book => db
              ::getBooksFromWorld(world._id, user._id).count()
              .flatMap(count => {
                return [
                  {path: ["booksById", book._id, "_id"], value: book._id},
                  {path: ["booksById", book._id, "title"], value: book.title},
                  {path: ["worldsById", world._id, "books", count - 1], value: $ref(['booksById', book._id])},
                  {path: ["worldsById", world._id, "books", "length"], value: count},
                ]
              })
            )
          )
      }
      ,
    },

    /**
     * Outlines
     */
    {
      route: 'worldsById[{keys:ids}].outlines[{integers:indices}]',
      get: pathSet => db
        ::getWorlds( pathSet.ids, user )
        .flatMap( withOutlineRefs( pathSet.indices ) )
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, 'outlines', i.idx ], 'ref' )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].outlines.push',
      call: ( { ids: [ id ] }, [ title = 'Unnamed Outline' ] ) => db
        ::getWorlds( [ id ], user )
        .flatMap( ({ readers = [], writers = [], owners = [], _id }) => db::create( 'outlines', {
          title,
          readers,
          writers: writers.concat( owners ),
        }))
        .flatMap( outline => {
          const charPV = Observable.of( outline )
            ::toPathValues( ( i, f ) => [ 'outlinesById', i._id, f ], [ 'title' ] )
            ;
          const worldPV = db
            ::pushToArray( 'worlds', user, [ id ], 'outlines', outline._id )
            ::withLastAndLength( i => $ref([ 'outlinesById', i ]) )
            ::toPathValues( ( i, f ) => [ 'worldsById', id, 'outlines', f ] )
            ;

          return Observable.from([ charPV, worldPV ])
            .selectMany( o => o )
            ;
        })
        ,
    },
    {
      route: 'worldsById[{keys:ids}].outlines.delete',
      call: ( { ids: [ world_id ] }, [ id ] ) => db
        ::getProps( 'worlds', [ world_id ], user )
        .flatMap( world => {
          const { outlines } = world;
          const idx = outlines.indexOf( id );

          if ( idx < 0 ) {
            throw new Error( 'Could not find outline to delete.' );
          }

          outlines.splice( idx, 1 );
          const length = outlines.length;

          return db::setProps( 'worlds', { [world_id]: { outlines } }, user )
            .flatMap( () => db::remove( 'outlines', user, id ) )
            .flatMap( count => {
              if ( ! count ) {
                throw new Error( 'Could not delete outline.' );
              }

              return [
                {
                  path: [ 'outlinesById', id ],
                  invalidated: true,
                },
                {
                  path: [ 'worldsById', world_id, 'outlines', 'length' ],
                  value: length,
                },
                {
                  path: [ 'worldsById', world_id, 'outlines', { from: idx, to: length } ],
                  invalidated: true,
                },
              ];
            })
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
        ::getWorlds( pathSet.ids, user )
        .flatMap( world => db.flatMap( getElementCount( world ) ) )
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, f, 'length' ], 'elements' )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].elements[{integers:indices}]',
      get: pathSet => db
        ::getWorlds( pathSet.ids, user )
        .flatMap( world => db.flatMap( getElementsForWorld( world, pathSet.indices ) ) )
        ::toPathValues( ( i, f ) => [ 'worldsById', i._id, 'elements', i.idx ], 'ref' )
        ,
    },
    {
      route: 'worldsById[{keys:ids}].elements.push',
      call: ( { ids: [ id ] }, [ element ] ) => db
        ::getWorlds( [ id ], user )
        .flatMap( ({ readers = [], writers = [], owners = [], _id }) => db::create( 'elements', {
          ...element,
          world_id: _id,
          readers,
          writers: writers.concat( owners ),
        }))
        .flatMap( element => {
          const charPV = Observable.of( element )
            ::toPathValues( ( i, f ) => [ 'elementsById', i._id, f ] )
            ;
          const worldPV = db
            ::getWorlds( [ id ], user )
            .flatMap( world => db.flatMap( getElementCount( world ) ) )
            .map( ({ elements: length }) => ({
              length,
              [length]: $ref([ 'elementsById', element._id ]),
            }))
            ::toPathValues( ( i, f ) => [ 'worldsById', id, 'elements', f ] )
            ;

          return Observable.from([ charPV, worldPV ])
            .selectMany( o => o )
            ;
        })
        ,
    },
    {
      route: 'worldsById[{keys:ids}].elements.delete',
      call: ( { ids: [ world_id ] }, [ id ] ) => db
        ::getWorlds( [ world_id ], user )
        .flatMap( world => db.flatMap( getElementCount( world ) ) )
        .flatMap( ({ elements }) => {
          return db
            ::remove( 'elements', user, id )
            .flatMap( success => {
              if ( ! success ) {
                throw new Error( 'Could not delete element.' );
              }

              const length = elements - 1;

              return [
                {
                  path: [ 'elementsById', id ],
                  invalidated: true,
                },
                {
                  path: [ 'worldsById', world_id, 'elements', 'length' ],
                  value: length,
                },
                {
                  path: [ 'worldsById', world_id, 'elements', { from: 0, to: length } ],
                  invalidated: true,
                },
              ];
            })
            ;
        })
        ,
    },
  ];
};

