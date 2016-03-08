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
  title: 1,
  slug: 1,
  colour: 1,
};

export const getProps = ( db, ids, fields ) => db
  .flatMap( db => db.find({ _id: { $in: ids } }).project( projection ).toArray() )
  .selectMany( docs => docs )
  .flatMap( doc => {
    return fields.map( field => ({
      path: [ 'worldsById', doc._id, field ],
      value: doc[ field ],
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
      path: [ 'worldsById', _id, field ],
      value: fields[ field ],
    }));
  })
  ;

export const getComponentCounts = ( db, ids, fields ) => db
  .flatMap( db => Observable.fromNodeCallback( db.aggregate, db )([
    { $match: { _id: { $in: ids } } },
    {
      $project: {
        _id: 1,
        characters: { $size: '$characters' },
        elements: { $size: '$elements' },
        outlines: { $size: '$outlines' },
      },
    },
  ]))
  .selectMany( docs => docs )
  .flatMap( ({ _id, ...doc }) => fields.map( field => ({
    path: [ 'worldsById', _id, field, 'length' ],
    value: doc[ field ],
  })))
  ;

