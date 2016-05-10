import { Observable } from 'rx';
import {
  toPathValues,
  withLastAndLength,
  create,
  addIndex,
  getWithinArray,
} from './../transforms';
import { getWorlds } from './../transforms/worlds';
import {
  $ref,
  $atom,
  $err,
  keysO,
  keys,
} from '../../utils';
import config from '../../config';
import UserVoiceSSO from 'uservoice-sso';

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
    {
      route: 'currentUserVoiceToken',
      get: pathSet => {
        const ssoUser = {
          guid: user._id,
          email: user.email,
          display_name: user.name,
        };
        const uv = new UserVoiceSSO( config.sso.uservoice.domain, config.sso.uservoice.key );
        const ssoToken = uv.createToken( ssoUser );

        return {
          path: [ 'currentUserVoiceToken' ],
          value: ssoToken,
        };
      },
    },
    // {
    //   route: 'usersById[{keys:ids}]["email"]',
    //   get: pathSet => getUsers( users, pathSet.ids, pathSet[ 2 ] ),
    // },

    /**
     * Worlds
     */
    {
      route: 'usersById[{keys:ids}].worlds.length',
      get: pathSet => db
        ::getWorlds( null, user )
        .toArray()
        .map( a => ({ _id: user._id, length: a.length }) )
        ::toPathValues( ( i, f ) => [ 'usersById', user._id, 'worlds', f ], 'length' )
        ,
    },
    {
      route: 'usersById[{keys:ids}].worlds[{integers:indices}]',
      get: pathSet => db
        ::getWorlds( null, user )
        .map( ({ _id }) => ({ _id, ref: $ref([ 'worldsById', _id ]) }) )
        .map( addIndex() )
        .filter( w => pathSet.indices.indexOf( w.idx ) !== -1 )
        ::toPathValues( ( i, f ) => [ 'usersById', user._id, 'worlds', i.idx ], 'ref' )
        ,
    },
    {
      route: 'usersById[{keys:ids}].worlds.push',
      call: ( { ids: [ id ] }, [ title = 'Unnamed World' ] ) => db
        ::create( 'worlds', {
          title,
          owners: [ user._id ],
          characters: [],
          outlines: [],
        })
        .flatMap( world => {
          const worldPV = Observable.of( world )
            ::toPathValues( ( i, f ) => [ 'worldsById', i._id, f ] )
            ;
          const worldsPV = db
            ::getWorlds( null, user )
            .toArray()
            ::withLastAndLength()
            ::toPathValues( ( i, f ) => [ 'usersById', id, 'worlds', f ] )
            ;

          return Observable.from([ worldsPV, worldPV ])
            .selectMany( o => o )
            ;
        })
        .catch(e=>console.log(e.stack))
        ,
    },

    /**
     * Files
     */
    {
      route: 'usersById[{keys:ids}].files.length',
      get: pathSet => db
        .flatMap( db => db.collection( 'users' ).find( { _id: { $in: pathSet.ids, $eq: user._id } } ).toArray() )
        .selectMany( d => d )
        .map( ({ _id, ...user }) => ({ _id, length: user.files ? user.files.length : 0 }) )
        ::toPathValues( ( i, f ) => [ 'usersById', i._id, 'files', f ], 'length' )
    },
    {
      route: 'usersById[{keys:ids}].files[{integers:indices}]["name", "url", "contentType", "size", "extension"]',
      get: pathSet => db
        .flatMap( db => db.collection( 'users' ).find( { _id: { $in: pathSet.ids, $eq: user._id } } ).toArray() )
        .selectMany( d => d )
        .flatMap( getWithinArray( 'files', pathSet.indices ) )
        .map( ({ files, ...o }) => ({ ...o, ...pathSet[ 4 ].reduce( ( o, k ) => { o[k] = files[k]; return o }, {} ) }) )
        ::toPathValues( ( i, f ) => [ 'usersById', i._id, 'files', i.idx, f ], pathSet[ 4 ] )
    },

    /**
     * ux
     */
    {
      route: 'usersById[{keys:ids}].ux.lastVisited',
      get: pathSet => db.flatMap( getLastVisited( user, pathSet.ids ) )
        ::toPathValues( ( i, f ) => [ 'usersById', i._id, 'ux', f ], 'lastVisited' )
        ,
      set: pathSet => db.flatMap( setLastVisited( user, pathSet.usersById ) )
        ::toPathValues( ( i, f ) => [ 'usersById', i._id, 'ux', f ], 'lastVisited' )
        ,
    },
  ];
};

