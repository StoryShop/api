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
        .flatMap( toPathValues( ( i, f ) => [ 'elementsByNamepart', f ] ) )
        ,
    },

    /**
     * Props
     */
    {
      route: 'elementsById[{keys:ids}]["_id", "title", "content", "cover", "tags"]',
      get: pathSet => db
        .flatMap( getProps( 'elements', pathSet.ids, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'elementsById', i._id, f ], pathSet[ 2 ] ) )
        ,
    },
    {
      route: 'elementsById[{keys:ids}]["title", "content", "cover", "tags"]',
      set: pathSet => db
        .flatMap( setProps( 'elements', pathSet.elementsById, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'elementsById', i._id, f ], i => keys( pathSet.elementsById[ i._id ] ) ) )
        ,
    },
  ];
};

