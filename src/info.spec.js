import test from 'tape';
import info from './info';

test( 'info', t => {
  t.plan( 1 );

  const expected = '/';
  const actual = info().path;

  t.equals( actual, expected, 'should have path /' );
});

