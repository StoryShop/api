import { Observable } from 'rx';
import {
  $ref,
  $atom,
  $err,
  keysO,
  keys,
} from '../../utils';

export const getCurrentUser = ( db, req ) => db.map( db => [{
  path: [ 'currentUser' ],
  value: $ref([ 'usersById', req.user._id ]),
}]);

// export const getUsers = ( db, ids, fields ) => db.flatMap( db => db.find({
//   _id: { $in: ids.map( id => id ) },
// }).toArray() )
// .selectMany( docs => docs )
// .flatMap( ({ _id, ...doc }) => fields.map( field => ({
//   path: [ 'usersById', _id, field ],
//   value: doc[ field ],
// })));

export const setLastVisited = ( db, ids ) => db
  .flatMap( db => keysO( ids ).flatMap( id => db.findOneAndUpdate(
    { _id: id },
    { $set: { 'ux.lastVisited': ids[ id ].ux.lastVisited } },
    { projection: { ux: 1 }, returnOriginal: false }
  )))
  .map( ({ value: { _id, ux } }) => ({
    path: [ 'usersById', _id, 'ux', 'lastVisited' ],
    value: ux.lastVisited,
  }))
  ;

export const getLastVisited = ( db, ids ) => db
  .flatMap( db => db.find( { _id: { $in: ids } }, { ux: 1 } ).toArray() )
  .selectMany( docs => docs )
  .map( doc => ({
    path: [ 'usersById', doc._id, 'ux', 'lastVisited' ],
    value: doc.ux.lastVisited,
  }))
  ;

export const getUserWorlds = ( db, ids, indices ) => db
  .flatMap( db => db.find( { _id: { $in: ids } }, { worlds: true } ).toArray() )
  .selectMany( docs => docs )
  .flatMap( ({ _id, worlds }) => indices.map( idx => ({
    path: [ 'usersById', _id, 'worlds', idx ],
    value: worlds[ idx ] ? $ref([ 'worldsById', worlds[ idx ] ]) : undefined,
  })))
  ;

export default ( db, req, res ) => {
  const users = db.map( db => db.collection( 'users' ) );

  return [
    {
      route: 'currentUser',
      get: pathSet => getCurrentUser( users, req ),
    },
    // {
    //   route: 'usersById[{keys:ids}]["email"]',
    //   get: pathSet => getUsers( users, pathSet.ids, pathSet[ 2 ] ),
    // },
    {
      route: 'usersById[{keys:ids}].worlds[{integers:indices}]',
      get: pathSet => getUserWorlds( users, pathSet.ids, pathSet.indices ),
    },
    {
      route: 'usersById[{keys:ids}].ux.lastVisited',
      get: pathSet => getLastVisited( users, pathSet.ids ),
      set: pathSet => setLastVisited( users, pathSet.usersById ),
    },
  ];
};

