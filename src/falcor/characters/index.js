import { keys } from '../../utils';
import {
  toPathValues,
  withComponentCounts,
  getWithinArray,
  setWithinArray,
  pushToArray,
  getProps,
  setProps,
} from './../transforms';

export default ( db, req, res ) => {
  const { user } = req;

  return [
    {
      route: 'charactersById[{keys:ids}]["_id", "name", "aliases", "avatar", "cover", "content"]',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', i._id, f ], pathSet[ 2 ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}]["name", "aliases", "avatar", "cover", "content"]',
      set: pathSet => db
        .flatMap( setProps( 'characters', pathSet.charactersById, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', i._id, f ] ), i => keys( pathSet.charactersById[ i._id ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}]["genes", "attributes","relationships"].length',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( withComponentCounts( pathSet[ 2 ] ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', i._id, f, 'length' ], pathSet[ 2 ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].attributes[{integers:indices}]',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( getWithinArray( 'attributes', pathSet.indices ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'attributes' ) )
        ,
      set: pathSet => db
        .flatMap( setWithinArray( 'characters', 'attributes', pathSet.charactersById, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'attributes' ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].attributes.push',
      call: ( { ids: [ id ] }, [ attribute ] ) => db
        .flatMap( pushToArray( 'characters', user, [ id ], 'attributes', attribute ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', id, 'attributes', f ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].genes[{integers:indices}]',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( getWithinArray( 'genes', pathSet.indices ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'genes' ) )
        ,
      set: pathSet => db
        .flatMap( setWithinArray( 'characters', 'genes', pathSet.charactersById, user ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'genes' ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].relationships[{integers:indices}]',
      get: pathSet => db
        .flatMap( getProps( 'characters', pathSet.ids, user ) )
        .flatMap( getWithinArray( 'relationships', pathSet.indices ) )
        .flatMap( toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'relationships' ) )
        ,
    },
  ];
};

