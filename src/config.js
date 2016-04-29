export default {
  server: {
    host: process.env.SS_HOST || 'dev.storyshopapp.com',
    port: process.env.SS_PORT || 9999,
  },

  jwt: {
    secret: process.env.JWT_SECRET || '98df4f11e10d6f217f5c2a713c53f5e3',
  },

  oauth: {
    amazon: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },

    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    },

    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
};

