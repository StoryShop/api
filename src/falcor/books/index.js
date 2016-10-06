import { Observable } from 'rx';
import { keys, $ref } from '../../utils';
import {
  getBooks,
  setBookProps,
  getWorldByBook
} from '../transforms/books'
import slug from 'slug'


export default ( db, req, res ) => {
  const {user} = req;
  return [
    {
      route: 'booksById[{keys:ids}]["_id", "title", "slug"]',
      get: ({ids})=> {
        return db
          ::getBooks(ids,user._id)
          .flatMap(book =>
            [
              {path: ["booksById", book._id, "_id"], value: book._id},
              {path: ["booksById", book._id, "title"], value: book.title},
              {path: ["booksById", book._id, "slug"], value: slug(book.title,{lower: true})},
            ]
          )
      }
    },
    {
      route: 'booksById[{keys:ids}]["title"]',
      set: pathSet => {
        return db
          ::setBookProps( pathSet.booksById, user )
          .flatMap(book => {
            return [
              {path: ["booksById", book._id, "title"], value: book.title},
              {path: ["booksById", book._id, "slug"], value: slug(book.title,{lower: true})},
            ]
          })
      }
    },
    {
      route: 'booksById[{keys:ids}].world',
      get: pathSet => {
        const {ids} = pathSet;
        return db
          ::getBooks(ids,user._id)
          .flatMap(book =>
            db::getWorldByBook(book._id)
              .map((worldId) =>
                [
                  {path: ["booksById", book._id, "world",], value: $ref(['worldsById', worldId])},
                ]
              )
          )
      }
    },
    {
      route: 'booksById[{keys:ids}].status',
      get: pathSet => {
        const {ids} = pathSet;
        ids.map(id => {
          return [
            {path: ["booksById", id, "status"], value: 0},
          ]
        })
      }
    },

  ]
}