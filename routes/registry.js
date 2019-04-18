var express = require('express');
var router = express.Router();
var archiver = require('../lib/archiver');

const MIME_SCHEMA_V2 = "application/vnd.docker.distribution.manifest.v2+json"
const MIME_GZIP = "application/x-gzip"

/* GET home page. */
router.get('/v2', function(req, res, next) {
  let obj = {
    "what": "Docker registry backed by DAT (https://datproject.org/)"
  }

  res.type("application/json");
  res.set("Docker-Distribution-API-Version", "registry/2.0");

  res.send(obj);
});

function sendConnectionError(res, message) {
  res.status(502);
  res.send({message: message});
}

function getDatOrFileReadStream(dat, path) {
  let readStream
  //if (connected) {
    readStream = dat.archive.createReadStream(path)
  /*}
  else {
    readStream = fs.createReadStream(`${localPath}/${path}`)
  }*/

  return readStream
}

function getFileToRetrieveAndContentType (req, path) {
  let fileToRetrieve
  let mime

  let accept = req.get('accept');
  if (accept.indexOf(MIME_SCHEMA_V2) >= 0) {
    mime = MIME_SCHEMA_V2
    fileToRetrieve = `${path}-v2`
  } else {
    if (path.endsWith("/latest")) {
      fileToRetrieve = path+"-v2"
      mime = MIME_SCHEMA_V2
    }
    else {
      fileToRetrieve = path
      mime = MIME_GZIP
    }
  }

  return {fileToRetrieve, mime}
}

router.get(/^\/v2\/([a-z0-9]*)\/(.+)/, async function(req, res, next) {
  console.log(req.params)
  let digest = req.params[0]
  let path = req.params[1]

  let dat = await archiver.get(digest)

  let {fileToRetrieve, mime} = getFileToRetrieveAndContentType(req, path)
  let asyncDatCreateReadStream = getDatOrFileReadStream(dat, fileToRetrieve)
  
  res.type(mime)

  asyncDatCreateReadStream.on('error', (e) => {
    console.log(e.stack)
    sendConnectionError(res, "Failed to send file in stream")
  })

  asyncDatCreateReadStream.pipe(res)
})

module.exports = router;
