import { Observable } from 'rx';
import {
  $ref,
  $atom,
  $err,
  keysO,
  keys,
} from '../../utils';

const projection = {
  _id: 1,
  genes: 1,
};

export const getGenes = ( db, ids, indices, fields ) => db
  .flatMap( db => db.find( { _id: { $in: ids } }, projection ).toArray() )
  .selectMany( docs => docs )
  .flatMap( ({ _id, genes }) => Observable.from( indices ).flatMap( idx => fields.map( field => ({
    path: [ 'charactersById', _id, 'genes', idx, field ],
    value: genes[ idx ] ? genes[ idx ][ field ] : undefined,
  }))))
  ;

export const setGenes = ( db, ids ) => db
  .flatMap( db => {
    return keysO( ids ).flatMap( id => db.findOneAndUpdate( { _id: id }, {
      $set: keys( ids[ id ].genes ).map( idx => keys( ids[ id ].genes[ idx ] ).map( field => ({
        [`genes.${idx}.${field}`]: ids[ id ].genes[ idx ][ field ],
      })))
      .reduce( ( a, b ) => a.concat( b ), [] )
      .reduce( ( a, b ) => ({ ...a, ...b }), {} )
    }, {
      projection,
      returnOriginal: false,
    }));
  })
  .flatMap( ({ value: { _id, genes } }) => keysO( ids[ _id ].genes ).flatMap( idx => keys( ids[ _id ].genes[ idx ] ).map( field => ({
    path: [ 'charactersById', _id, 'genes', idx, field ],
    value: $atom( genes[ idx ][ field ] ),
  }))))
  ;

