import {Observable} from 'rx';
import {
  keysO,
} from '../../utils';

import {accessControl} from './index'


export function getBooks(ids, userId, secure) {
  return this.flatMap(db =>
    Observable.from(ids)
      .flatMap(id =>
        this::permissionBook(id, userId, secure)
          .map(permission => {
            if (permission === false)
              throw new Error("Not authorized");
            return id;
          })
      )
      .toArray()
      .flatMap(ids => {
          return db.mongo.collection('books').find({_id: {$in: ids}}).toArray()
        }
      )
      .flatMap(normalize => normalize)
  )
}

export function setBookProps(propsById) {
  return this.flatMap(db => {
    return keysO(propsById)
      .flatMap(_id => {
        return db.mongo.collection('books').findOneAndUpdate({_id}, {$set: propsById[_id]}, {
          returnOriginal: false,
        });
      })
      .map(book => book.value)
      ;
  });
}


export function getBooksLength(worldID) {
  const query = `
    match (b:Book)-[rel:IN]->(w:World)
    WHERE rel.archived = false and w._id = {worldID}
    return count(b) as count
  `;
  return this.flatMap(db =>db.neo.run(query, {worldID}))
    .map(record =>
      record.get('count').toNumber()
    )
}

export function getWorldByBook(bookId) {
  const query = `
    match (b:Book)-[rel:IN]->(w:World)
    WHERE rel.archived = false and b._id = "${bookId}"
    return w._id as id
  `;
  return this.flatMap(db => db.neo.run(query))
    .map(record =>
      record.get('id')
    )
}


export function permissionBook(bookId, userId, write) {

  const permissions = accessControl(write);

  const query = `
    MATCH (b:Book)-[r:IN]->(w:World)<-[rel]-(u:User)
    WHERE b._id = {bookId} AND u._id ={userId} 
    AND (${permissions})
    return count(rel) > 0 as permission
  `;

  return this.flatMap(db => db.neo.run(query, {bookId, userId}))
    .map(record =>
      record.get('permission')
    )
}
