import express from 'express';
import info from '../info';

const router = express.Router();

router.get( '/', function ( req, res ) {
  res.json( info() );
});

export default router;

