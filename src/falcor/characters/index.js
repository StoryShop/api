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
      route: 'charactersById[{keys:ids}]["_id", "name", "aliases", "avatar", "content"]',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( toPathValues( pathSet[ 2 ], ( i, f ) => [ 'charactersById', i._id, f ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}]["name", "aliases", "avatar", "content"]',
      set: pathSet => db
        .flatMap( setProps( 'characters', pathSet.charactersById, user ) )
        .flatMap( toPathValues( i => keys( pathSet.charactersById[ i._id ] ), ( i, f ) => [ 'charactersById', i._id, f ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}]["genes", "attributes","relationships"].length',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( withComponentCounts( pathSet[ 2 ] ) )
        .flatMap( toPathValues( pathSet[ 2 ], ( i, f ) => [ 'charactersById', i._id, f, 'length' ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].attributes[{integers:indices}]',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( getWithinArray( 'attributes', pathSet.indices ) )
        .flatMap( toPathValues( 'attributes', ( i, f ) => [ 'charactersById', i._id, f, i.idx ] ) )
        ,
      set: pathSet => db
        .flatMap( setWithinArray( 'characters', 'attributes', pathSet.charactersById, user ) )
        .flatMap( toPathValues( 'attributes', ( i, f ) => [ 'charactersById', i._id, f, i.idx ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].genes[{integers:indices}]',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( getWithinArray( 'genes', pathSet.indices ) )
        .flatMap( toPathValues( 'genes', ( i, f ) => [ 'charactersById', i._id, f, i.idx ] ) )
        ,
      set: pathSet => db
        .flatMap( setWithinArray( 'characters', 'genes', pathSet.charactersById, user ) )
        .flatMap( toPathValues( 'genes', ( i, f ) => [ 'charactersById', i._id, f, i.idx ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].relationships[{integers:indices}]',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( getWithinArray( 'relationships', pathSet.indices ) )
        .flatMap( toPathValues( 'relationships', ( i, f ) => [ 'charactersById', i._id, f, i.idx ] ) )
        ,
    },
  ];
};

