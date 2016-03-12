import { Observable } from 'rx';
import { $err, $atom, keys } from '../../utils';

export const toPathValues = ( fields, pathGen ) => item => {
  if ( typeof fields === 'function' ) {
    fields = fields( item );
  }

  if ( typeof fields === 'string' ) {
    fields = [ fields ];
  }

  const getVal = field => {
    if ( item.$error ) {
      return value.$error;
    } else {
      const value = item[ field ];

      // It might be an atom.
      if ( typeof value === 'object' ) {
        // If the value is, e.g., a $ref, we just return it.
        if ( value.$type ) {
          return value;
        }

        return $atom( value );
      }

      return value;
    }
  };

  return fields.map( field => ({
    path: pathGen( item, field ),
    value: getVal( field ),
  }));
};

export const withComponentCounts = fields => item => {
  const counts = {
    _id: item._id,
  };

  fields.forEach( field => counts[ field ] = item[ field ].length );

  return Observable.just( counts );
};

export const getWithinArray = ( fields, indices ) => item => {
  const res = [];

  if ( typeof fields === 'string' ) {
    fields = [ fields ];
  }

  fields.forEach( field => indices.forEach( idx => res.push({
    _id: item._id,
    idx,
    [ field ]: item[ field ] ? item[ field ][ idx ] : undefined,
  })));

  return res;
};

export const setWithinArray = ( collection, field, props, user ) => db => {
  const ids = keys( props );
  db = db.collection( collection );

  return Observable.from( ids )
    .flatMap( id => {
      return db.findOneAndUpdate( { _id: id, writers: { $eq: user._id } }, {
        $set: keys( props[ id ][ field ] ).map( idx => ({
          [`${field}.${idx}`]: props[ id ][ field ][ idx ].value,
        }))
        .reduce( ( a, b ) => ({ ...a, ...b }), {} )
      }, { returnOriginal: false } );
    })
    .map( c => c.value )
    .flatMap( c =>
      c[ field ]
      .map( ( value, idx ) => ({ _id: c._id, idx: `${idx}`, [field]: $atom(value) }) )
    )
    .filter( i => keys( props[ i._id ][ field ] ).indexOf( i.idx ) !== -1 )
    ;
};
