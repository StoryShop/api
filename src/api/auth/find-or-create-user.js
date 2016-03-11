import { Observable } from 'rx';
import { generateId } from '../../utils';

export default ( database, profile ) => {
  let db = database.map( db => db.collection( 'users' ) );
  const email = profile.emails[0].value;

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
          first: profile.name.givenName,
          last: profile.name.familyName,
          display: profile.displayName,
        },
      };

      return db
        .flatMap( db => db.insertOne( user ) )
        .map( () => user )
        ;
    })
    ;
};

