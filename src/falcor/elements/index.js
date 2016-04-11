import { keys } from '../../utils';
import {
  toPathValues,
  withComponentCounts,
  getWithinArray,
  setWithinArray,
  getProps,
  setProps,
} from './../transforms';

export default ( db, req, res ) => {
  const { user } = req;

  return [
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

