import { Observable } from 'rx';
import { ref, atom, error } from 'falcor-json-graph';
import shortid from 'shortid';

export const $ref = ref;
export const $atom = atom;
export const $err = error;

export const keys = obj => Object.getOwnPropertyNames( obj );
export const keysO = obj => Observable.from( keys( obj ) );

export const generateId = () => shortid.generate();

