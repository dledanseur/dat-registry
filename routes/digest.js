var express = require('express');
var router = express.Router();

var archiver = require('../lib/archiver')

function mapDat(dat) {
  return {
    key: dat.key.toString('hex'),
    connected: (dat.network && dat.network.connected) ? true : false
  }
}

async function _resultOrError(fn, res) {
  try {
    await fn()
  }
  catch (e) {
    console.log(e)
    res.status(500)
    res.send({message: e.message})
  }
}

/* GET home page. */
router.put('/:digest', async function(req, res, next) {
  _resultOrError ( async () => {
    let archive = await archiver.add(req.params.digest)
    res.send(mapDat(archive))
  }, res)
})

router.delete('/:digest', async function(req, res, next) {
  _resultOrError ( async () => {
    await archiver.remove(req.params.digest)
    res.send({message: 'deleted'})
  }, res)
})

module.exports = router