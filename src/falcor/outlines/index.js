import opmlGen from 'opml-generator';
import { keys } from '../../utils';
import {
  toPathValues,
  withComponentCounts,
  getWithinArray,
  setWithinArray,
  getProps,
  setProps,
} from './../transforms';

export default ( db, req, res ) => {
  const { user } = req;

  return [
    {
      route: 'outlinesById[{keys:ids}]["_id", "title", "content"]',
      get: pathSet => db
        ::getProps( 'outlines', pathSet.ids, user )
        ::toPathValues( ( i, f ) => [ 'outlinesById', i._id, f ], pathSet[ 2 ] )
        ,
    },
    {
      route: 'outlinesById[{keys:ids}]["title", "content"]',
      set: pathSet => db
        ::setProps( 'outlines', pathSet.outlinesById, user )
        ::toPathValues( ( i, f ) => [ 'outlinesById', i._id, f ], i => keys( pathSet.outlinesById[ i._id ] ) )
        ,
    },
    {
      route: 'outlinesById[{keys:ids}].opml',
      get: pathSet => db
        ::getProps( 'outlines', pathSet.ids, user )
        .map( ({ _id, title, content }) => {
          let opmlHeader = {
            "title": "StoryShop Import",
            "dateCreated": new Date(),
          };

          const outline = [
            {
              text: title,
              _children: [],
            }
          ];

          let lastHeader;
          let lastHeaderIndex = -1;
          let beatIndex;
          let nextBlock;
          content.blocks.forEach( block => {
            if ( block.type === 'header-two' ) {
              lastHeader = {
                text: block.text,
                _children: [],
              };

              lastHeaderIndex++;
              beatIndex = 1;

              outline[0]._children.push( lastHeader );
              return;
            }

            nextBlock = {
              text: "Beat " + beatIndex,
              _note: block.text,
            };
            beatIndex++;

            outline[0]._children[ lastHeaderIndex ]._children.push( nextBlock );
          });

          return {
            _id,
            opml: opmlGen( opmlHeader, outline ),
          };
        })
        ::toPathValues( ( i, f ) => [ 'outlinesById', i._id, f ], 'opml' )
        ,
    },
  ];
};

