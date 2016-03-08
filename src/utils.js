import { Observable } from 'rx';
import { Model } from 'falcor';
import shortid from 'shortid';

export const {
  ref: $ref,
  atom: $atom,
  error: $err,
} = Model;

export const keys = obj => Object.getOwnPropertyNames( obj );
export const keysO = obj => Observable.from( keys( obj ) );

export const generateId = () => shortid.generate();

