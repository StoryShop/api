import passport from 'passport';

export const isLoggedIn = ( req, res, next ) => {
  return passport.authenticate( 'jwt', { session: false } )( req, res, next );
};

