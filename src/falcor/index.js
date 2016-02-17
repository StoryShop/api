import Router from 'falcor-router';
import falcorExpress from 'falcor-express';
import worlds from './worlds';

export default falcorExpress.dataSourceRoute( ( req, res ) => new Router(
  []
    .concat( worlds( req, res ) )
));

