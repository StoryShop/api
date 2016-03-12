import { Observable } from 'rx';
import { ref, atom, error } from 'falcor-json-graph';
import shortid from 'shortid';

export const $ref = ref;
export const $atom = atom;
export const $err = error;

export const keys = obj => Object.getOwnPropertyNames( obj );
export const keysO = obj => Observable.from( keys( obj ) );

export const generateId = () => shortid.generate();

export const unwrapAtomsInObject = item => keys( item )
  .map( key => ({
    key,
    value: typeof item[ key ] === 'object' ? item[ key ].value : item[ key ],
  })).reduce( ( o, p ) => {
    o[ p.key ] = p.value;
    return o;
  }, {})
  ;

