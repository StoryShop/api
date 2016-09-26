import { Observable } from 'rx';
import {
  $atom,
  $err,
  $ref,
  keysO,
  keys,
  generateId,
 collection,  unwrapAtomsInObject,
} from '../../utils';

export function toPathValues ( pathGen, fields ) {
  return this.flatMap( item => {
    if ( ! fields ) {
      fields = keys( item );
    } else if ( typeof fields === 'function' ) {
      fields = fields( item );
    }

    if ( typeof fields === 'string' ) {
      fields = [ fields ];
    }

    const getVal = field => {
      if ( item.$error ) {
        return value.$error;
      } else {
        const value = item[ field ];

        // It might be an atom.
        if ( typeof value === 'object' ) {
          // If the value is, e.g., a $ref, we just return it.
          if ( value.$type ) {
            return value;
          }

          return $atom( value );
        }

        return value;
      }
    };

    return fields.map( field => ({
      path: pathGen( item, field ),
      value: getVal( field ),
    }));
  });
}

export const fuzzyFind = ( collection, field, patterns, user ) => db => {
  return Observable.fromPromise( db.mongo.collection( collection ).find({
    [field]: { $in: patterns.map( p => new RegExp( `^.*${p}.*$`, 'ig' ) ) },
    $or: [
      { writers: { $eq: user._id } },
      { readers: { $eq: user._id } },
    ]}).toArray() )
    .selectMany( w => w )
    ;
};

export function getProps ( collection, ids, user ) {
  return this.flatMap( db => {
    return Observable.fromPromise( db.mongo.collection( collection ).find({ _id: { $in: ids }, $or: [
        { writers: { $eq: user._id } },
        { readers: { $eq: user._id } },
      ]}).toArray() )
      .selectMany( w => w )
      ;
  });
}

export function setProps ( collection, propsById, user ) {
  return this.flatMap( db => {
    return keysO( propsById )
      .flatMap( _id => {
        const writers = { $eq: user._id };
        const $set = unwrapAtomsInObject( propsById[ _id ] );

        return db.mongo.collection( collection ).findOneAndUpdate( { _id, writers }, { $set }, {
          returnOriginal: false,
        });
      })
      .map( props => props.value )
      ;
  });
}

export const getRandom = ( collection ) => db => {
  const coll = db.mongo.collection( collection );

  return Observable.fromPromise( coll.count() )
    .flatMap( count => coll.find().limit( 1 ).skip( Math.floor( Math.random() * count ) ).toArray() )
    .selectMany( w => w )
    ;
};

export const withComponentCounts = fields => item => {
  const counts = {
    _id: item._id,
  };

  fields.forEach( field => counts[ field ] = item[ field ] ? item[ field ].length : 0 );

  return Observable.just( counts );
};

export const getWithinArray = ( fields, indices ) => item => {
  const res = [];

  if ( typeof fields === 'string' ) {
    fields = [ fields ];
  }

  fields.forEach( field => indices.forEach( idx => res.push({
    _id: item._id,
    idx,
    [ field ]: item[ field ] ? item[ field ][ idx ] : undefined,
  })));

  return res;
};

export const setWithinArray = ( collection, field, props, user ) => db => {
  const ids = keys( props );
  db = db.mongo.collection( collection );

  return Observable.from( ids )
    .flatMap( id => {
      return db.findOneAndUpdate( { _id: id, writers: { $eq: user._id } }, {
        $set: keys( props[ id ][ field ] ).map( idx => ({
          [`${field}.${idx}`]: props[ id ][ field ][ idx ].value,
        }))
        .reduce( ( a, b ) => ({ ...a, ...b }), {} )
      }, { returnOriginal: false } );
    })
    .map( c => c.value )
    .flatMap( c =>
      c[ field ]
      .map( ( value, idx ) => ({ _id: c._id, idx: `${idx}`, [field]: $atom(value) }) )
    )
    .filter( i => keys( props[ i._id ][ field ] ).indexOf( i.idx ) !== -1 )
    ;
};

export function pushToArray ( collection, user, ids, field, value ) {
  return this.flatMap( db => {
    db = db.mongo.collection( collection );

    return Observable.from( ids )
      .flatMap( id => db.findOneAndUpdate(
        {
          _id: id,
          $or: [
            { owners: { $eq: user._id } },
            { writers: { $eq: user._id } },
          ],
        },
        { $push: { [field]: value } },
        { returnOriginal: false }
      ))
      .map( c => c.value[ field ] )
      ;
  });
}

export function withLastAndLength ( fn ) {
  return this.map( arr => ({
    [arr.length - 1]: fn ? fn( arr[ arr.length - 1 ] ) : arr[ arr.length - 1 ],
    length: arr.length,
  }));
}

export const addIndex = () => {
  let idx = 0;

  return item => ({ idx: idx++, ...item });
};

export function create ( collection, props ) {
  return this.flatMap( db => {
    db = db.mongo.collection( collection );
    props._id = generateId();

    return Observable.fromPromise( db.insertOne( props ) ).flatMap( r => r.ops );
  });
}

export function remove ( collection, user, _id ) {
  return this.flatMap( db => {
    db = db.mongo.collection( collection );

    return Observable.fromPromise( db.removeMany({ _id: _id, writers: user._id }) )
      .map( r => r.result.n )
      ;
    });
}

export function archiveNode(nodeLabel, nodeId, userId) {
  const query = `
    MATCH (node:${nodeLabel} {_id: {nodeId} }) 
    OPTIONAL MATCH (node)<-[rel]-() 
    SET node.archived = true, 
    node.archived_at = timestamp(), 
    node.archiver = {userId}, 
    rel.archived = true, 
    rel.archived_at = timestamp(), 
    rel.archiver = {userId} 
    RETURN DISTINCT node`
  return this.flatMap(db =>
    db.neo.run(query,{nodeId, userId})
  )
}


export function archiveRelationship(relType, fromNodeId, toNodeId, userId) {
  const query = `
   MATCH (start {_id: {fromNodeId}})-[rel]->(end {_id: {toNodeId}})
   WHERE type(rel) = {relType}
   SET rel.archived = true, rel.archived_at = timestamp(), rel.archiver = {userId}
   RETURN rel`
  return this.flatMap(db =>
    db.neo.run(query,{fromNodeId, toNodeId, userId, relType})
  )
}
