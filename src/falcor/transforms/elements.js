import { Observable } from 'rx';
import {
  $err,
  $ref,
  keysO,
  keys,
} from '../../utils';

export const getElementsForWorld = ( world, indices ) => db => {
  return Observable.fromPromise( db.collection( 'elements' ).find({ world_id: world._id }).toArray() )
    .flatMap( elements => indices.map( idx => ({
      _id: world._id,
      idx,
      ref: elements[ idx ] ? $ref([ 'elementsById', elements[ idx ]._id ]) : undefined,
    })))
    ;
};

// export const getElements = ( ids, user ) => db => {
//   return Observable.fromPromise( db.collection( 'elements' ).find({ _id: { $in: ids }, $or: [
//       { owners: { $eq: user._id } },
//       { writers: { $eq: user._id } },
//       { readers: { $eq: user._id } },
//     ]}).toArray() )
//     .selectMany( w => w )
//     ;
// };

export const getElementCount = world => db => {
  return Observable.fromPromise( db.collection( 'elements' ).count({ world_id: world._id }) )
  .map( elements => ({ _id: world._id, elements }) )
  ;
};

