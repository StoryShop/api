import { Router } from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import google from 'googleapis';
import Logger from '../../logger';
import { isLoggedIn } from './middleware';
import config from '../../config';
import findOrCreateUser from './find-or-create-user';

const log = Logger( 'Authentication' );

export default db => {
  const router = new Router();

  const googleOauthClient = new google.auth.OAuth2(
    config.oauth.google.clientId,
    config.oauth.google.clientSecret
  );

  const jwtSecret = config.jwt.secret;

  router.post( '/token', ( req, res ) => {
    const { provider, token } = req.body;

    switch ( provider ) {
      case 'google':
        googleOauthClient.verifyIdToken( token, config.oauth.google.clientId, ( err, data ) => {
          if ( err ) {
            return res.status(400).json({ status: 400, message: err });
          }

          const { email, given_name, family_name, name } = data.getPayload();

          findOrCreateUser( db, email, given_name, family_name, name )
          .subscribe( user => {
            const body = ({
              provider,
              token: jwt.sign({ provider: 'google', email, name }, jwtSecret, { subject: user._id } ),
            });

            res.json( body );
          }, err => {
            res.status(500).json({ status: 500, message: err })
          });
        });
        break;
      default:
        res.status(400).json({ status: 400, message: `Unknown OAuth provider '${provider}'` });
    }
  });

  router.get( '/test', isLoggedIn, ( req, res ) => {
    res.json({ msg: 'success', user: req.user });
  });

  return router;
};

