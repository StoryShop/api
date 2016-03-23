import { Observable } from 'rx';
import {
  $err,
  $ref,
  keysO,
  keys,
} from '../../utils';

export const getWorlds = ( ids, user ) => db => {
  return Observable.fromPromise( db.collection( 'worlds' ).find({ _id: { $in: ids }, $or: [
      { owners: { $eq: user._id } },
      { writers: { $eq: user._id } },
      { readers: { $eq: user._id } },
    ]}).toArray() )
    .selectMany( w => w )
    ;
};

export const setWorldProps = ( propsById, user ) => db => keysO( propsById )
  .flatMap( _id => {
    const $or = [
      { owners: { $eq: user._id } },
      { writers: { $eq: user._id } },
    ];

    return db.collection( 'worlds' ).findOneAndUpdate( { _id, $or }, { $set: propsById[ _id ] }, {
      returnOriginal: false,
    });
  })
  .map( world => world.value )
  ;

export const withCharacterRefs = indices => world => indices.map( idx => ({
  _id: world._id,
  idx,
  ref: world.characters[ idx ] ? $ref([ 'charactersById', world.characters[ idx ] ]) : undefined,
}));

export const withOutlineRefs = indices => world => indices.map( idx => ({
  _id: world._id,
  idx,
  ref: world.outlines[ idx ] ? $ref([ 'outlinesById', world.outlines[ idx ] ]) : undefined,
}));

