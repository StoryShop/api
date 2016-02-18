import debug from 'debug';

export default name => ({
  debug ( ...args ) {
    debug( `StoryShopAPI::${ name }::log` )( ...args );
  },

  warn ( ...args ) {
    debug( `StoryShopAPI::${ name }::warn` )( ...args );
  },

  error ( ...args ) {
    debug( `StoryShopAPI::${ name }::error` )( ...args );
  }
});

