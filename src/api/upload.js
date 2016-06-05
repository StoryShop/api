import fs from 'fs';
import path from 'path';
import express from 'express';
import multiparty from 'multiparty';
import { S3 } from 'aws-sdk';
import Logger from '../logger';
import { generateId } from '../utils';

const log = Logger( 'UploadsRouter' );
const uploadBucket = process.env.UPLOAD_BUCKET || 'uploads-dev.storyshopapp.com';
const region = process.env.UPLOAD_BUCKET_REGION || 'us-west-2';
const s3 = new S3({
  region,
  params: {
    Bucket: uploadBucket,
    ACL: 'public-read',
  },
});

export default ( db ) => {
  const router = express.Router();

  router.post( '/', ( req, res, next ) => {
    const form = new multiparty.Form();

    form.parse( req, ( err, fields, files ) => {
      if ( err ) {
        return res.json({ status: 400, error: 'Bad Request', message: err.toString() });
      }

      if ( ! files.file || ! files.file.length ) {
        return res.json({ status: 400, error: 'Bad Request', message: 'No file uploaded.' });
      }

      const file = files.file[ 0 ];
      const ext = path.extname( file.originalFilename );
      const filename = generateId() + ext;

      s3.putObject({
        Key: filename,
        Body: fs.createReadStream( file.path ),
      }, ( err, data ) => {
        if ( err ) {
          log.error( 'Could not upload file to S3' );
          log.error( 'File Details:', JSON.stringify( file, null, 2 ) );
          log.error( err.stack );

          return res.json({ status: 500, error: 'Internal Server Error', message: err.toString() });
        }

        // Save the file to the db.
        const upload = {
          name: file.originalFilename,
          url: `http://${uploadBucket}.s3-website-${region}.amazonaws.com/${filename}`,
          contentType: file.headers[ 'content-type' ],
          size: file.size,
          extension: ext,
        };

        db
          .map( db => db.collection( 'users' ) )
          .flatMap( db => db.findOneAndUpdate(
            { _id: req.user._id },
            { $push: { files: upload }, $inc: { filesLength: 1 } },
            {
              projection: {
                files: { $slice: -1 },
                filesLength: 1,
              },
              returnOriginal: false,
            }
          ))
          .subscribe( ({ value: { files, filesLength } }) => {
            const [ value ] = files;
            res.json([
              {
                path: [ 'usersById', req.user._id, 'files', 'length' ],
                value: filesLength,
              },
              {
                path: [ 'usersById', req.user._id, 'files', filesLength - 1 ],
                value,
              },
            ]);
          }, err => log.error( 'Persist failed: ', err ) );
          ;
      });
    });
  });

  return router;
};

