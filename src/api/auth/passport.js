import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as AmazonStrategy } from 'passport-amazon';
import config from '../../config';
import findOrCreateUser from './find-or-create-user';
import findUser from './find-user';

export default ( db ) => {
  const { server, oauth, jwt } = config;
  const jwtSecret = jwt.secret;

  const oauthHandler = ( accessToken, refreshToken, profile, done ) => {
    findOrCreateUser( db, profile ).subscribe( user => done ( null, user ), err => done( err ) );
  };

  passport.use( new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromUrlQueryParameter( 'jwt' ),
    secretOrKey: jwtSecret,
  }, ( payload, done ) => {
    findUser( db, payload.sub ).subscribe( user => done( null, user ), err => done ( err ) );
  }));

  passport.use( new GoogleStrategy({
    clientID: oauth.google.clientId,
    clientSecret: oauth.google.clientSecret,
    callbackURL: `http://${server.host}:${server.port}/api/auth/return/google`,
  }, oauthHandler ));

  passport.use( new AmazonStrategy({
    clientID: oauth.amazon.clientId,
    clientSecret: oauth.amazon.clientSecret,
    callbackURL: `http://${server.host}:${server.port}/api/auth/return/amazon`,
    profileFields: [ 'id', 'email', 'name', 'link' ],
  }, oauthHandler ));

  passport.use( new FacebookStrategy({
    clientID: oauth.facebook.clientId,
    clientSecret: oauth.facebook.clientSecret,
    callbackURL: `http://${server.host}:${server.port}/api/auth/return/facebook`,
    profileFields: [ 'id', 'email', 'name', 'link' ],
  }, oauthHandler ));

  return passport;
};

