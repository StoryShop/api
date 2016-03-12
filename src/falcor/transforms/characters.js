import { Observable } from 'rx';
import {
  $err,
  $ref,
  keysO,
  keys,
  unwrapAtomsInObject,
} from '../../utils';

export const getCharacters = ( ids, user ) => db => {
  return Observable.fromPromise( db.collection( 'characters' ).find({ _id: { $in: ids }, $or: [
      { writers: { $eq: user._id } },
      { readers: { $eq: user._id } },
    ]}).toArray() )
    .selectMany( w => w )
    ;
};

export const setCharacterProps = ( propsById, user ) => db => keysO( propsById )
  .flatMap( _id => {
    const writers = { $eq: user._id };
    const $set = unwrapAtomsInObject( propsById[ _id ] );

    return db.collection( 'characters' ).findOneAndUpdate( { _id, writers }, { $set }, {
      returnOriginal: false,
    });
  })
  .map( character => character.value )
  ;

