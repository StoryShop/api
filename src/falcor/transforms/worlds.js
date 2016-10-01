import { Observable } from 'rx';
import {
  $err,
  $ref,
  keysO,
  keys,
} from '../../utils';
import {
  create,
  accessControl
} from './index'

export function getWorlds ( ids, user ) {
  const query = {
    $or: [
      { owners: { $eq: user._id } },
      { writers: { $eq: user._id } },
      { readers: { $eq: user._id } },
    ],
  };

  if ( ids ) {
    query._id = { $in: ids };
  }

  return this.flatMap( db => {
    return Observable.fromPromise( db.mongo.collection( 'worlds' ).find( query ).toArray() )
    .selectMany( w => w )
    ;
  });
};

/**
 * This method will replace getWorlds after 'worlds' has been migrated to Neo4j
 * @param ids
 * @param userId
 * @param secure
 * @returns {any[]|Observable<R>|*|any}
 */

export function getWorldsNext(ids, userId, secure) {
  return this.flatMap(db =>
    Observable.from(ids)
      .flatMap(id =>
        this::permissionWorld(id, userId, secure)
          .map(permission => {
            if (permission === false)
              throw new Error("Not authorized");
            return id;
          })
      )
      .toArray()
      .flatMap(ids => {
          return db.mongo.collection('worlds').find({_id: {$in: ids}}).toArray()
        }
      )
      .flatMap(normalize => normalize)
  )
}


export function setWorldProps ( propsById, user ) {
  return this.flatMap( db => {
    return keysO( propsById )
      .flatMap( _id => {
        const $or = [
          { owners: { $eq: user._id } },
          { writers: { $eq: user._id } },
        ];

        return db.mongo.collection( 'worlds' ).findOneAndUpdate( { _id, $or }, { $set: propsById[ _id ] }, {
          returnOriginal: false,
        });
      })
      .map( world => world.value )
      ;
  });
}

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




export function getBooksFromWorld(worldId, userId, write)  {
  const permissions = accessControl(write);

  const query = `
    MATCH (b:Book)-[relB:IN]->(w:World)<-[rel]-(u:User)
    WHERE u._id = {userId} AND relB.archived = false
    AND w._id = {worldId} AND (${permissions}) 
    return b._id as id
    ORDER BY relB.created_at ASC
  `;
  return this.flatMap(db => db.neo.run(query,{worldId, userId}))
    .map(record => record.get('id'))
}


export function createBook(worldId, title, userId){
  const props = {
    title,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
  return this
    ::create('books', props)
    .flatMap(book => this
      ::createRelationFromBookToWorld(book._id,worldId, userId)
      .map(() => book)
    )
}



function createRelationFromBookToWorld(bookId, worldId, creator){
  const query = `
   MERGE (w:World {_id: {worldId} })
   MERGE (b:Book {_id: {bookId} })
   MERGE (b)-[rel:IN]-(w)
   SET rel.archived = false, b.archived = false,
   rel.created_at = timestamp(), rel.creator = {creator}
   return rel as rel`;

  return this.flatMap(db => db.neo.run(query,{bookId, worldId, creator}))
    .map(record => record.get('rel'))
}



export function permissionWorld(worldId, userId, write) {
  const permissions = accessControl(write);

  const query = `
    MATCH (w:World)<-[rel]-(u:User) 
    WHERE w._id = {worldId} AND u._id ={userId} 
    AND (${permissions})
    return count(rel) > 0 as permission
  `;
  return this.flatMap(db =>
    db.neo.run(query,{worldId, userId})
  ).map(record =>
    record.get('permission')
  )
}
