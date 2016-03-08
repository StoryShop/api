import { Observable } from 'rx';
import {
  getProps,
  setProps,
  getComponentCounts,
} from './props';
import { getCharacters } from './characters';

export default ( db, req, res ) => {
  const worlds = Observable.fromPromise( db ).map( db => db.collection( 'worlds' ) );

  return [
    {
      route: 'worldsById[{keys:ids}]["_id", "title", "slug", "colour"]',
      get: pathSet => getProps( worlds, pathSet.ids, pathSet[ 2 ] ),
    },
    {
      route: 'worldsById[{keys:ids}]["title", "slug", "colour"]',
      set: pathSet => setProps( worlds, pathSet.worldsById ),
    },
    {
      route: 'worldsById[{keys:ids}]["elements","outlines","characters"].length',
      get: pathSet => getComponentCounts( worlds, pathSet.ids, pathSet[ 2 ] ),
    },
    {
      route: 'worldsById[{keys:ids}].characters[{integers:indices}]',
      get: pathSet => getCharacters( worlds, pathSet.ids, pathSet.indices ),
    },
  ];
};

