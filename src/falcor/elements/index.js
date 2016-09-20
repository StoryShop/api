import { Observable } from 'rx';
import { keys, $ref } from '../../utils';
import {
  toPathValues,
  withComponentCounts,
  getWithinArray,
  setWithinArray,
  getProps,
  setProps,
  fuzzyFind,
  remove,
  pushToArray,
  withLastAndLength,
} from './../transforms';

export default ( db, req, res ) => {
  const { user } = req;

  return [
    /**
     * Autocomplete
     */
    {
      route: 'elementsByNamepart[{keys:patterns}]',
      get: pathSet => Observable.from( pathSet.patterns )
        .flatMap( pattern => db
          .flatMap( fuzzyFind( 'elements', 'title', [ pattern ], user ) )
          .map( element => $ref([ 'elementsById', element._id ]) )
          .toArray()
          .map( a => [ pattern, a ] ) )
        .reduce( ( obj, [ pattern, a ] ) => { obj[ pattern ] = a; return obj; }, {})
        ::toPathValues( ( i, f ) => [ 'elementsByNamepart', f ] )
        ,
    },

    /**
     * Props
     */
    {
      route: 'elementsById[{keys:ids}]["_id", "title", "content", "tags"]',
      get: pathSet => db
        ::getProps( 'elements', pathSet.ids, user )
        ::toPathValues( ( i, f ) => [ 'elementsById', i._id, f ], pathSet[ 2 ] )
        ,
    },
    {
      route: 'elementsById[{keys:ids}]["title", "content", "tags"]',
      set: pathSet => db
        ::setProps( 'elements', pathSet.elementsById, user )
        ::toPathValues( ( i, f ) => [ 'elementsById', i._id, f ], i => keys( pathSet.elementsById[ i._id ] ) )
        ,
    },

    /**
     * Cover
     */
    {
      route: 'elementsById[{keys:ids}].cover',
      get: pathSet => db
        ::getProps( 'elements', pathSet.ids, user )
        .map( ({ _id, cover }) => ({ _id, cover: cover ? $ref( cover ) : undefined }) )
        ::toPathValues( ( i, f ) => [ 'elementsById', i._id, f ], 'cover' )
        ,
      call: ( { ids: [ id ] }, [ cover ] ) => db
        ::setProps( 'elements', { [id]: { cover } }, user )
        .map( ({ _id, cover }) => ({ _id, cover: $ref( cover ) }) )
        ::toPathValues( ( i, f ) => [ 'elementsById', i._id, f ], 'cover' )
    },

    /**
     * Files
     */
    {
      route: 'elementsById[{keys:ids}].files.length',
      get: pathSet => db
        ::getProps( 'elements', pathSet.ids, user )
        .flatMap( withComponentCounts([ 'files' ]) )
        ::toPathValues( ( i, f ) => [ 'elementsById', i._id, f, 'length' ], 'files' )
        ,
    },
    {
      route: 'elementsById[{keys:ids}].files[{integers:indices}]',
      get: pathSet => db
        ::getProps( 'elements', pathSet.ids, user )
        .flatMap( getWithinArray( 'files', pathSet.indices ) )
        .map( ({ files, ...o }) => ({ files: $ref( files ), ...o }) )
        ::toPathValues( ( i, f ) => [ 'elementsById', i._id, f, i.idx ], 'files' )
        ,
    },
    {
      route: 'elementsById[{keys:ids}].files.push',
      call: ( { ids: [ id ] }, [ ref ] ) => db
        ::pushToArray( 'elements', user, [ id ], 'files', ref.value )
        ::withLastAndLength( i => $ref( i ) )
        ::toPathValues( ( i, f ) => [ 'elementsById', id, 'files', f ] )
        ,
    },
    {
      route: 'elementsById[{keys:ids}].files.delete',
      call: ( { ids: [ element_id ] }, [ idx ] ) => db
        ::getProps( 'elements', [ element_id ], user )
        .flatMap( element => {
          const { files } = element;

          if ( idx >= files.length ) {
            throw new Error( 'Could not find file to delete.' );
          }

          files.splice( idx, 1 );
          const length = files.length;

          return db::setProps( 'elements', { [element_id]: { files } }, user )
            .flatMap( () => {
              return [
                {
                  path: [ 'elementsById', element_id, 'files', 'length' ],
                  value: length,
                },
                {
                  path: [ 'elementsById', element_id, 'files', { from: idx, to: length } ],
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

