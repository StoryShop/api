import { Observable } from 'rx';

export default ( database, _id ) => {
  let db = database.map( db => db.collection( 'users' ) );

  return db.flatMap( db => db.findOne({ _id }));
};


