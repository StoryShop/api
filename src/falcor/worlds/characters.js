import { Observable } from 'rx';
import {
  $ref,
  $atom,
  $err,
  keysO,
  keys,
} from '../../utils';

export const getCharacters = ( db, ids, indices ) => db
  .flatMap( db => db.find( { _id: { $in: ids } }, { characters: true } ).toArray() )
  .selectMany( docs => docs )
  .flatMap( ({ _id, characters }) => indices.map( idx => ({
    path: [ 'worldsById', _id, 'characters', idx ],
    value: characters[ idx ] ? $ref([ 'charactersById', characters[ idx ] ]) : undefined,
  })))
  ;

