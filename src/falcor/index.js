import Router from 'falcor-router';
import falcorExpress from 'falcor-express';
import worlds from './worlds';
import users from './users';
import characters from './characters';

export default db => falcorExpress.dataSourceRoute( ( req, res ) => new Router(
  []
    .concat( users( db, req, res ) )
    .concat( worlds( db, req, res ) )
    .concat( characters( db, req, res ) )
));

