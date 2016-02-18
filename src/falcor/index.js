import Router from 'falcor-router';
import falcorExpress from 'falcor-express';
import worlds from './worlds';

export default db => falcorExpress.dataSourceRoute( ( req, res ) => new Router(
  []
    .concat( worlds( db, req, res ) )
));

