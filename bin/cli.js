#!/usr/bin/env node

let { handler, client } = require('../index.js')
let argv = require('minimist')(process.argv.slice(2))
let fs = require('fs')
let { randomBytes } = require('crypto')
let Lotion = require('lotion')
let readline = require('readline')

let cmd = argv._[0]
let port = process.env.PORT || 3232

function generateCredentials() {
  let cl = client()
  // generate a keypair
  let privKey = cl.generatePrivateKey()
  let pubKey = cl.generatePublicKey(privKey)
  let address = cl.generateAddress(pubKey)

  let credentials = {
    privKey: privKey.toString('hex'),
    pubKey: pubKey.toString('hex'),
    address: address.toString('hex')
  }

  return credentials
}

function init() {
  let credentials = generateCredentials()
  let initialCoins = 10000
  let initialState = {
    balances: {
      [credentials.address]: initialCoins
    },
    nonces: {}
  }

  fs.writeFileSync('./credentials.json', JSON.stringify(credentials))
  fs.writeFileSync('./initial-state.json', JSON.stringify(initialState))
}

async function main() {
  let cl = client('http://localhost:' + port)
  if (cmd === 'init') {
    init() 
  }

  if (cmd === 'start') {
    if(!fs.existsSync('./credentials.json')){
      let credentials = generateCredentials()
      fs.writeFileSync('./credentials.json', JSON.stringify(credentials))
    }
    let { address } = getCredentials()
    address = address.toString('hex')
    let opts = {
      port,
      logTendermint: argv.v,
    }

    let isValidator = !!!argv._[1]
    if(isValidator){
      opts.initialState = JSON.parse(fs.readFileSync('./initial-state.json'))
    } else {
      opts.genesisKey = argv._[1]
    }

    if(argv.p) {
      opts.peers = [argv.p]
    }
    let lotion = Lotion(opts)
    lotion(handler).then(genesisKey => {
      if(isValidator) {
        console.log('peers can connect with: ')
        console.log('$ lcoin start ' + genesisKey)
        console.log('\n')
      } 
      console.log('your address: ' + address + '\n')

      setInterval(async () => {
        let balance = await cl.getBalance(address)
        readline.moveCursor(process.stdout, 0, -1)
        readline.clearScreenDown(process.stdout)
        console.log('your balance: ' + balance + ' coins')
      }, 500)
    })

  }

  function getCredentials() {
    let creds = JSON.parse(fs.readFileSync('./credentials.json'))
    creds.privKey = Buffer.from(creds.privKey, 'hex')
    creds.pubKey = Buffer.from(creds.pubKey, 'hex')
    creds.address = Buffer.from(creds.address, 'hex')
    return creds
  }

  if (cmd === 'send') {
    let creds = getCredentials()
    if (!argv.address || !argv.amount) {
      console.log(
        'must include --amount and --address arguments with send command'
      )
      return
    }
    if (argv.address.length !== 64) {
      console.log('invalid address')
      return
    }
    if (!Number.isInteger(argv.amount)) {
      console.log('invalid amount')
      return
    }
    let receiverAddress = argv.address
    let result = await cl.send(creds.privKey, {
      address: receiverAddress,
      amount: argv.amount
    })
    console.log(result)
  }
}
main()
