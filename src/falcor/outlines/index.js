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
        .flatMap( getProps( 'outlines', pathSet.ids, user ) )
        .flatMap( toPathValues( pathSet[ 2 ], ( i, f ) => [ 'outlinesById', i._id, f ] ) )
        ,
    },
    {
      route: 'outlinesById[{keys:ids}]["title", "content"]',
      set: pathSet => db
        .flatMap( setProps( 'outlines', pathSet.outlinesById, user ) )
        .flatMap( toPathValues( i => keys( pathSet.outlinesById[ i._id ] ), ( i, f ) => [ 'outlinesById', i._id, f ] ) )
        ,
    },
  ];
};

