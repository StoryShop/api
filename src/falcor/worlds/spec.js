import test from 'tape';
import { getWorldProps } from './';

test( 'getWorldProps with 1 id and 1 field', async t => {
  let actual, expected, promise;

  t.plan( 2 );

  promise = getWorldProps( [ 1 ], [ 'name' ] );
  actual = typeof promise.then;
  expected = 'function';
  t.equals( actual, expected, 'should return a promise' );

  expected = [
    { path: [ 'worldsById', 1, 'name' ], value: 'Sesame Street' },
  ];
  actual = await promise;
  t.deepEquals( actual, expected, 'should output correct path' );

  t.end();
});

test( 'getWorldProps with 1 id and 2 field', async t => {
  let actual, expected, promise;

  t.plan( 2 );

  promise = getWorldProps( [ 1 ], [ 'name', 'msg' ] );
  actual = typeof promise.then;
  expected = 'function';
  t.equals( actual, expected, 'should return a promise' );

  expected = [
    { path: [ 'worldsById', 1, 'name' ], value: 'Sesame Street' },
    { path: [ 'worldsById', 1, 'msg' ], value: 'Hello, world!' },
  ];
  actual = await promise;
  t.deepEquals( actual, expected, 'should output correct path' );

  t.end();
});

test( 'getWorldProps with 2 ids and 1 field', async t => {
  let actual, expected, promise;

  t.plan( 2 );

  promise = getWorldProps( [ 1, 2 ], [ 'name' ] );
  actual = typeof promise.then;
  expected = 'function';
  t.equals( actual, expected, 'should return a promise' );

  expected = [
    { path: [ 'worldsById', 1, 'name' ], value: 'Sesame Street' },
    { path: [ 'worldsById', 2, 'name' ], value: 'Sesame Street' },
  ];
  actual = await promise;
  t.deepEquals( actual, expected, 'should output correct path' );

  t.end();
});

test( 'getWorldProps with 2 ids and 2 field', async t => {
  let actual, expected, promise;

  t.plan( 2 );

  promise = getWorldProps( [ 1, 2 ], [ 'name', 'msg' ] );
  actual = typeof promise.then;
  expected = 'function';
  t.equals( actual, expected, 'should return a promise' );

  expected = [
    { path: [ 'worldsById', 1, 'name' ], value: 'Sesame Street' },
    { path: [ 'worldsById', 1, 'msg' ], value: 'Hello, world!' },
    { path: [ 'worldsById', 2, 'name' ], value: 'Sesame Street' },
    { path: [ 'worldsById', 2, 'msg' ], value: 'Hello, world!' },
  ];
  actual = await promise;
  t.deepEquals( actual, expected, 'should output correct path' );

  t.end();
});

