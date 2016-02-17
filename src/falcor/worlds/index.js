export const getWorldProps = ( ids, fields ) => new Promise( resolve => {
  /**
   * An array of paths and their values we'll send over the wire.
   */
  let paths = [];

  /**
   * A mock world to use
   */
  const testWorld = {
    name: 'Sesame Street',
    msg: 'Hello, world!',
  };

  /**
   * Iterate through each requested World ID...
   */
  ids.forEach( id => {
    /**
     * And add to `paths` the path/value pairs for each requested field.
     */
    paths = paths.concat( fields.map( field => {
      return { path: [ 'worldsById', id, field ], value: testWorld[ field ] };
    }));
  });

  resolve( paths );
});

export default ( req, res ) => [
  {
    route: 'worldsById[{integers:ids}]["name", "msg"]',
    get: pathSet => getWorldProps( pathSet.ids, pathSet[ 2 ] ),
  },
];
