var Dat = require('dat-node')
var fs = require('fs')
var fsPromises = fs.promises
var util = require('util')
var rimraf = require('rimraf')
var _ = require('lodash')

let asyncDat = util.promisify(Dat)
let asyncRimraf = util.promisify(rimraf)

function toPromise(fn, bindObj, ...args) {
  return new Promise( (resolve, reject) => {
    let func = fn.bind(bindObj)

    func(...args, (err, ...resArgs) => {
      if (err) {
        reject(err)
      } else {
        resolve(...resArgs)
      }
    })
  })
}

function getDatRootFolder() {
  let datRootFolder = process.env.DATA_FOLDER || process.cwd()

  return datRootFolder
}

async function getDatFolder(digest) {
  let dataFolder = getDatRootFolder()

  let datFolder = `${dataFolder}/${digest}`

  try {
    await fsPromises.mkdir(datFolder)
  } catch (e) {
    // doesn't care if the folder already exists, continue
    if (e.code !== 'EEXIST') {
      throw e
    }
  }

  return datFolder
   
}

class Archiver {

  constructor() {
    this.dats = {}

    this._restoreCurrentDats()
  }

  async _getDat(digest) {
    let foundDat

    if (this.dats[digest]) {
      foundDat = this.dats[digest]
    }

    else {
      let datFolder = await getDatFolder(digest)
    
      let dat = await asyncDat(datFolder, {
        key: digest
      });

      this.dats[digest] = dat
      foundDat = dat
    }
  
    if (!foundDat.network || !foundDat.network.connected || !foundDat.network.connecting) {
      console.error(`Dat ${digest} not connected. Attempt to connect`)
      await toPromise(foundDat.joinNetwork, foundDat)
    }

    return foundDat
  }

  async _restoreCurrentDats() {
    let rootFolder = getDatRootFolder()
  
    let files = await fsPromises.readdir(rootFolder)
  
    files.forEach( async f => {
      let dat = await this._getDat(f)
    })
  }

  get(key) {
    return this.dats[key]
  }

  async add(key) {
    let dat = await this._getDat(key)

    return dat
  }

  async remove(key) {
    let dat = this.dats[key]

    if (dat) {
      dat.leaveNetwork()
      let folder = await getDatFolder(key)
      await asyncRimraf(folder)
      delete this.dats[key]
    }
  }

  list() {
    return Object.keys(this.dats).map( (k) => this.dats[k] )
  }
}

module.exports = new Archiver()