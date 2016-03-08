import {
  $ref,
  $atom,
  $err,
  keysO,
  keys,
} from '../../utils';

const projection = {
  _id: 1,
  attributes: 1,
};

export const getAttributes = ( db, ids, indices ) => db
  .flatMap( db => db.find( { _id: { $in: ids } }, projection ).toArray() )
  .selectMany( docs => docs )
  .flatMap( ({ _id, attributes }) => indices.map( idx => ({
    path: [ 'charactersById', _id, 'attributes', idx ],
    value: attributes[ idx ] ? $atom( attributes[ idx ] ) : undefined,
  })))
  ;

export const setAttributes = ( db, ids ) => db
  .flatMap( db => {
    return keysO( ids ).flatMap( id => db.findOneAndUpdate( { _id: id }, {
      $set: keys( ids[ id ].attributes ).map( idx => ({
        [`attributes.${idx}`]: ids[ id ].attributes[ idx ].value,
      }))
      .reduce( ( a, b ) => ({ ...a, ...b }), {} )
    }, {
      projection,
      returnOriginal: false,
    }));
  })
  .flatMap( ({ value: { _id, attributes } }) => keys( ids[ _id ].attributes ).map( idx => ({
    path: [ 'charactersById', _id, 'attributes', idx ],
    value: $atom( attributes[ idx ] ),
  })))
  ;

