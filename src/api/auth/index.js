import { Router } from 'express';
import passport from 'passport';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import Logger from '../../logger';
import { isLoggedIn } from './middleware';
import config from '../../config';

const log = Logger( 'Authentication' );

export default db => {
  const router = new Router();

  const returnOpts = { session: false };
  const googleOpts = { scope: [ 'profile', 'email' ] };
  const amazonOpts = { scope: [ 'profile' ] };
  const facebookOpts = { scope: [ 'public_profile', 'email' ] };

  const jwtSecret = config.jwt.secret;
  const jwtSendHandler = ( req, res ) => {
    res.json({ token: jwt.sign({ test: 'placeholder' }, jwtSecret, { subject: req.user._id }) });
  };

  router.get( '/login/google', passport.authenticate( 'google', googleOpts ) );
  router.get( '/return/google', passport.authenticate( 'google', returnOpts ), jwtSendHandler );

  router.get( '/login/amazon', passport.authenticate( 'amazon', returnOpts ) );
  router.get( '/return/amazon', passport.authenticate( 'amazon', returnOpts ), jwtSendHandler );

  router.get( '/login/facebook', passport.authenticate( 'facebook', facebookOpts ) );
  router.get( '/return/facebook', passport.authenticate( 'facebook', returnOpts ), jwtSendHandler );

  router.get( '/test', isLoggedIn, ( req, res ) => {
    res.json({ msg: 'success', user: req.user });
  });

  return router;
};

