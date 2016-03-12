import { Observable } from 'rx';
import { generateId } from '../../utils';

export default ( database, email, givenName, familyName, displayName ) => {
  let db = database.map( db => db.collection( 'users' ) );

  return db
    .flatMap( db => db.findOne({
      email,
    }))
    .flatMap( user => {
      if ( user ) {
        return Observable.just( user );
      }

      user = {
        _id: generateId(),
        email,
        name: {
          first: givenName,
          last: familyName,
          display: displayName,
        },
      };

      return db
        .flatMap( db => db.insertOne( user ) )
        .map( () => user )
        ;
    })
    ;
};

