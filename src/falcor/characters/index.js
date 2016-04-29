import { Observable } from 'rx';
import { keys, $ref } from '../../utils';
import {
  toPathValues,
  withComponentCounts,
  getWithinArray,
  setWithinArray,
  pushToArray,
  getProps,
  setProps,
  fuzzyFind,
  getRandom,
  withLastAndLength,
} from './../transforms';

export default ( db, req, res ) => {
  const { user } = req;

  return [
    /**
     * Autocomplete
     */
    {
      route: 'charactersByNamepart[{keys:patterns}]',
      get: pathSet => Observable.from( pathSet.patterns )
        .flatMap( pattern => db
          .flatMap( fuzzyFind( 'characters', 'name', [ pattern ], user ) )
          .map( character => $ref([ 'charactersById', character._id ]) )
          .toArray()
          .map( a => [ pattern, a ] ) )
        .reduce( ( obj, [ pattern, a ] ) => { obj[ pattern ] = a; return obj; }, {})
        ::toPathValues( ( i, f ) => [ 'charactersByNamepart', f ] )
        ,
    },

    /**
     * Props
     */
    {
      route: 'charactersById[{keys:ids}]["_id", "name", "aliases", "avatar", "cover", "content"]',
      get: pathSet => db
        ::getProps( 'characters', pathSet.ids, user )
        ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f ], pathSet[ 2 ] )
        ,
    },
    {
      route: 'charactersById[{keys:ids}]["name", "aliases", "avatar", "cover", "content"]',
      set: pathSet => db
        ::setProps( 'characters', pathSet.charactersById, user )
        ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f ], i => keys( pathSet.charactersById[ i._id ] ) )
        ,
    },
    {
      route: 'charactersById[{keys:ids}]["genes", "attributes","relationships"].length',
      get: pathSet => db
        ::getProps( 'characters', pathSet.ids, user )
        .flatMap( withComponentCounts( pathSet[ 2 ] ) )
        ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f, 'length' ], pathSet[ 2 ] )
        ,
    },

    /**
     * Attributes
     */
    {
      route: 'charactersById[{keys:ids}].attributes[{integers:indices}]',
      get: pathSet => db
        ::getProps( 'characters', pathSet.ids, user )
        .flatMap( getWithinArray( 'attributes', pathSet.indices ) )
        ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'attributes' )
        ,
      set: pathSet => db
        .flatMap( setWithinArray( 'characters', 'attributes', pathSet.charactersById, user ) )
        ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'attributes' )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].attributes.push',
      call: ( { ids: [ id ] }, [ attribute ] ) => db
        ::pushToArray( 'characters', user, [ id ], 'attributes', attribute )
        ::withLastAndLength()
        ::toPathValues( ( i, f ) => [ 'charactersById', id, 'attributes', f ] )
        ,
    },

    /**
     * Relationships
     */
    {
      route: 'charactersById[{keys:ids}].relationships[{integers:indices}]',
      get: pathSet => db
        ::getProps( 'characters', pathSet.ids, user )
        .flatMap( getWithinArray( 'relationships', pathSet.indices ) )
        ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'relationships' )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].relationships.push',
      call: ( { ids: [ id ] }, [ _id, description ] ) => db
        ::getProps( 'characters', [ _id ], user )
        .first()
        .map( c => ({ _id: c._id, avatar: c.avatar, name: c.name }) )
        .flatMap( c => db
          ::pushToArray( 'characters', user, [ id ], 'relationships', { ...c, description } )
          ::withLastAndLength()
        )
        ::toPathValues( ( i, f ) => [ 'charactersById', id, 'relationships', f ] )
        ,
    },

    /**
     * Genes
     */
    {
      route: 'charactersById[{keys:ids}].genes[{integers:indices}]',
      get: pathSet => db
        ::getProps( 'characters', pathSet.ids, user )
        .flatMap( getWithinArray( 'genes', pathSet.indices ) )
        ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'genes' )
        ,
      set: pathSet => db
        .flatMap( setWithinArray( 'characters', 'genes', pathSet.charactersById, user ) )
        ::toPathValues( ( i, f ) => [ 'charactersById', i._id, f, i.idx ], 'genes' )
        ,
    },
    {
      route: 'charactersById[{keys:ids}].genes.push',
      call: ( { ids: [ id ] }, [ gene ] ) => db
        ::pushToArray( 'characters', user, [ id ], 'genes', gene )
        .tap(v=>console.log("v",v))
        ::withLastAndLength()
        ::toPathValues( ( i, f ) => [ 'charactersById', id, 'genes', f ] )
        ,
    },
    {
      route: 'genes.random',
      get: pathSet => db
        .flatMap( getRandom( 'genes' ) )
        .first()
        .map( gene => ({
          gene: {
            $type: 'atom',
            $expires: -1000,
            value: gene
          },
        }))
        ::toPathValues( ( i, f ) => [ 'genes', 'random' ], 'gene' )
    },
  ];
};

