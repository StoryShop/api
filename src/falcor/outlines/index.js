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
      route: 'outlinesById[{keys:ids}]["_id", "title", "content"]',
      get: pathSet => db
        ::getProps( 'outlines', pathSet.ids, user )
        ::toPathValues( ( i, f ) => [ 'outlinesById', i._id, f ], pathSet[ 2 ] )
        ,
    },
    {
      route: 'outlinesById[{keys:ids}]["title", "content"]',
      set: pathSet => db
        ::setProps( 'outlines', pathSet.outlinesById, user )
        ::toPathValues( ( i, f ) => [ 'outlinesById', i._id, f ], i => keys( pathSet.outlinesById[ i._id ] ) )
        ,
    },
  ];
};

