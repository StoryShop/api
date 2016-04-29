// import passport from 'passport';
import jwt from 'jsonwebtoken';
import Logger from '../../logger';
import config from '../../config';

const withUserLog = Logger( 'auth::withUser' );

export const isLoggedIn = () => ( req, res, next ) => {
  if ( req.user && req.user._id ) {
    return next();
  }

  res.status(401).json({ status: 401, message: 'Not authenticated' });
};

export const withUser = () => ( req, res, next ) => {
  if ( ! req.get( 'Authorization' ) ) {
    withUserLog.debug( 'No authorization header' );
    return next();
  }

  const matches = req.get( 'Authorization' ).match( /^(\S+)\s+(\S+)$/ );
  if ( ! matches ) {
    withUserLog.warn( 'Invalid authorization header' );
    return next();
  }

  const [ _, scheme, token ] = matches;

  if ( scheme !== 'JWT' ) {
    withUserLog.warn( 'Invalid authorization scheme' );
    return next();
  }

  jwt.verify( token, config.jwt.secret, ( err, decoded ) => {
    if ( err ) {
      withUserLog.error( 'Invalid authorization token' );
      return res.status( 400 ).json({ status: 400, message: 'Invalid authorization token' });
    }

    req.user = {
      _id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  });
};

