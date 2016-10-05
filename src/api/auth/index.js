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
            if ( ! user.sub_sts ) {
              return res.status( 403 ).json({ status: 403, message: 'Account is not part of beta' });
            }

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
      case 'facebook':
        let http = require("es6-request");
        let access_token = config.oauth.facebook.clientId + "|" + config.oauth.facebook.clientSecret

        http.get( "https://graph.facebook.com/debug_token" )
        .query({
          "input_token": token,
          "access_token": access_token,
        })
        .done((response, body) => {
          let object = JSON.parse(body.toString());
          if ( object.data.is_valid ) {
            http.get( "https://graph.facebook.com/v2.5/" + object.data.user_id )
            .query({
              "access_token": token,
              "fields": "email,name",
            })
            .done((reply, stuff) => {
              let me = JSON.parse(stuff.toString());
              const email = me.email;
              const name = me.name;
              findOrCreateUser( db, email, "", "", name )
              .subscribe( user => {
                const body = ({
                  provider,
                  token: jwt.sign({ provider: 'facebook', email }, jwtSecret, { subject: user._id } ),
                });

                res.json( body );
              }, err => {
                res.status(500).json({ status: 500, message: err })
              });
            })
          }
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

