import { Observable } from 'rx';
import { getProps, setProps, setAliases, getComponentCounts } from './props';
import { getAttributes, setAttributes } from './attributes';
import { getGenes, setGenes } from './genes';

export default ( db, req, res ) => {
  const characters = Observable.fromPromise( db ).map( db => db.collection( 'characters' ) );

  return [
    {
      route: 'charactersById[{keys:ids}]["_id", "name", "aliases"]',
      get: pathSet => getProps( characters, pathSet.ids, pathSet[ 2 ] ),
    },
    {
      route: 'charactersById[{keys:ids}]["name"]',
      set: pathSet => setProps( characters, pathSet.charactersById ),
    },
    {
      route: 'charactersById[{keys:ids}].aliases',
      set: pathSet => setAliases( characters, pathSet.charactersById ),
    },
    {
      route: 'charactersById[{keys:ids}]["genes", "attributes"].length',
      get: pathSet => getComponentCounts( characters, pathSet.ids, pathSet[ 2 ] ),
    },
    {
      route: 'charactersById[{keys:ids}].attributes[{integers:indices}]',
      get: pathSet => getAttributes( characters, pathSet.ids, pathSet.indices ),
      set: pathSet => setAttributes( characters, pathSet.charactersById ),
    },
    {
      route: 'charactersById[{keys:ids}].genes[{integers:indices}]["gene","allele"]',
      get: pathSet => getGenes( characters, pathSet.ids, pathSet.indices, pathSet[ 4 ] ),
      set: pathSet => setGenes( characters, pathSet.charactersById ),
    },
  ];
};

