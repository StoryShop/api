import { keys } from '../../utils';
import {
  toPathValues,
  withComponentCounts,
  getWithinArray,
  setWithinArray,
} from './../transforms';
import {
  getCharacters,
  setCharacterProps,
} from '../transforms/characters';

export default ( db, req, res ) => {
  const { user } = req;

  return [
    {
      route: 'charactersById[{keys:ids}]["_id", "name", "aliases", "avatar"]',
      get: pathSet => db
        .flatMap( getCharacters( pathSet.ids, user ) )
        .flatMap( toPathValues( pathSet[ 2 ], ( i, f ) => [ 'charactersById', i._id, f ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}]["name", "aliases", "avatar"]',
      set: pathSet => db
        .flatMap( setCharacterProps( pathSet.charactersById, user ) )
        .flatMap( toPathValues( i => keys( pathSet.charactersById[ i._id ] ), ( i, f ) => [ 'charactersById', i._id, f ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}]["genes", "attributes"].length',
      get: pathSet => db
        .flatMap( getCharacters( pathSet.ids, user ) )
        .flatMap( withComponentCounts( pathSet[ 2 ] ) )
        .flatMap( toPathValues( pathSet[ 2 ], ( i, f ) => [ 'charactersById', i._id, f, 'length' ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].attributes[{integers:indices}]',
      get: pathSet => db
        .flatMap( getCharacters( pathSet.ids, user ) )
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
        .flatMap( getCharacters( pathSet.ids, user ) )
        .flatMap( getWithinArray( 'genes', pathSet.indices ) )
        .flatMap( toPathValues( 'genes', ( i, f ) => [ 'charactersById', i._id, f, i.idx ] ) )
        ,
      set: pathSet => db
        .flatMap( setWithinArray( 'characters', 'genes', pathSet.charactersById, user ) )
        .flatMap( toPathValues( 'genes', ( i, f ) => [ 'charactersById', i._id, f, i.idx ] ) )
        ,
    },
  ];
};

