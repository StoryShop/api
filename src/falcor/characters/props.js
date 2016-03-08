import { Observable } from 'rx';
import {
  $ref,
  $atom,
  $err,
  keysO,
  keys,
} from '../../utils';

const isAtom = field => [ 'aliases' ].indexOf( field ) !== -1;

const projection = {
  _id: 1,
  name: 1,
  aliases: 1,
};

export const getProps = ( db, ids, fields ) => db
  .flatMap( db => db.find({ _id: { $in: ids } }).project( projection ).toArray() )
  .selectMany( docs => docs )
  .flatMap( doc => {
    return fields.map( field => ({
      path: [ 'charactersById', doc._id, field ],
      value: isAtom( field ) ? $atom( doc[ field ] ) : doc[ field ],
    }));
  })
  ;

export const setProps = ( db, ids ) => db
  .flatMap( db => {
    return keysO( ids ).flatMap( id => db.findOneAndUpdate( { _id: id }, { $set: ids[ id ] }, {
      projection,
      returnOriginal: false,
    }));
  })
  .flatMap( ({ value }) => {
    const { _id, ...fields } = value;

    return keys( fields ).map( field => ({
      path: [ 'charactersById', _id, field ],
      value: fields[ field ],
    }));
  })
  ;

export const setAliases = ( db, ids ) => db
  .flatMap( db => {
    return keysO( ids ).flatMap( id => db.findOneAndUpdate( { _id: id }, {
      $set: { aliases: ids[ id ].aliases.value }
    }, {
      projection,
      returnOriginal: false,
    }));
  })
  .map( ({ value: { _id, aliases } }) => ({
    path: [ 'charactersById', _id, 'aliases' ],
    value: $atom( aliases ),
  }))
  ;

export const getComponentCounts = ( db, ids, fields ) => db
  .flatMap( db => Observable.fromNodeCallback( db.aggregate, db )([
    { $match: { _id: { $in: ids } } },
    {
      $project: {
        _id: 1,
        genes: { $size: '$genes' },
        attributes: { $size: '$attributes' },
      },
    },
  ]))
  .selectMany( docs => docs )
  .flatMap( ({ _id, ...doc }) => fields.map( field => ({
    path: [ 'charactersById', _id, field, 'length' ],
    value: doc[ field ],
  })))
  ;

