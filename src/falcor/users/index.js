import { Observable } from 'rx';
import { toPathValues } from './../transforms';
import {
  $ref,
  $atom,
  $err,
  keysO,
  keys,
} from '../../utils';

// export const getUsers = ( db, ids, fields ) => db.flatMap( db => db.find({
//   _id: { $in: ids.map( id => id ) },
// }).toArray() )
// .selectMany( docs => docs )
// .flatMap( ({ _id, ...doc }) => fields.map( field => ({
//   path: [ 'usersById', _id, field ],
//   value: doc[ field ],
// })));

export const setLastVisited = ( user, ids ) => db =>
  keysO( ids ).filter( id => id === user._id ).flatMap( id => db.collection( 'users' ).findOneAndUpdate(
    { _id: id },
    { $set: { 'ux.lastVisited': ids[ id ].ux.lastVisited } },
    { returnOriginal: false }
  ))
  .map( ({ value: { _id, ux } }) => ({ _id, ...ux }) )
  ;

export const getLastVisited = ( user, ids ) => db =>
  Observable.fromPromise( db.collection( 'users' ).find( { _id: { $in: ids, $eq: user._id } } ).toArray() )
  .selectMany( docs => docs )
  .map( ({ _id, ux }) => ({ _id, ...ux }) )
  ;

export const getUserWorlds = ( user, ids, indices ) => db =>
  Observable.fromPromise( db.collection( 'users' ).find( { _id: { $in: ids, $eq: user._id } } ).toArray() )
  .selectMany( docs => docs )
  .flatMap( ({ _id, worlds }) => worlds.map( ( w, idx ) => ({ _id, idx, worlds: $ref([ 'worldsById', w ]) }) ) )
  .filter( item => indices.indexOf( item.idx ) !== -1 )
  ;

export default ( db, req, res ) => {
  const { user } = req;

  return [
    {
      route: 'currentUser',
      get: pathSet => [{
        path: [ 'currentUser' ],
        value: $ref([ 'usersById', user ? user._id : undefined ]),
      }],
    },
    // {
    //   route: 'usersById[{keys:ids}]["email"]',
    //   get: pathSet => getUsers( users, pathSet.ids, pathSet[ 2 ] ),
    // },
    {
      route: 'usersById[{keys:ids}].worlds[{integers:indices}]',
      get: pathSet => db.flatMap( getUserWorlds( user, pathSet.ids, pathSet.indices ) )
        .flatMap( toPathValues( 'worlds', ( i, f ) => [ 'usersById', i._id, f, i.idx ] ) )
        ,
    },
    {
      route: 'usersById[{keys:ids}].ux.lastVisited',
      get: pathSet => db.flatMap( getLastVisited( user, pathSet.ids ) )
        .flatMap( toPathValues( 'lastVisited', ( i, f ) => [ 'usersById', i._id, 'ux', f ] ) )
        ,
      set: pathSet => db.flatMap( setLastVisited( user, pathSet.usersById ) )
        .flatMap( toPathValues( 'lastVisited', ( i, f ) => [ 'usersById', i._id, 'ux', f ] ) )
        ,
    },
  ];
};

