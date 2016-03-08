import fs from 'fs';
import path from 'path';
import express from 'express';
import multiparty from 'multiparty';
import { S3 } from 'aws-sdk';
import Logger from '../logger';
import { generateId } from '../utils';

const log = Logger( 'ApiRouter' );
const router = express.Router();
const uploadBucket = process.env.UPLOAD_BUCKET || 'uploads-dev.storyshopapp.com';
const s3 = new S3({
  region: 'us-west-2',
  params: {
    Bucket: uploadBucket,
    ACL: 'public-read',
  },
});

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

      res.json({
        name: file.originalFilename,
        url: `http://s3-us-west-2.amazonaws.com/${uploadBucket}/${filename}`,
        contentType: file.headers[ 'content-type' ],
        size: file.size,
        extension: ext,
      });
    });
  });
});

export default router;

