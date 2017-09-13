let lotion = require('lotion')
let coin = require('../')

async function main() {
  let client = coin.client('http://localhost:3000')
  let privKey = client.generatePrivateKey()
  let pubKey = client.generatePublicKey(privKey)
  let address = client.generateAddress(pubKey)
  let opts = {
    port: 3000,
    initialState: {
      balances: {
        [address.toString('hex')]: 1000
      },
      nonces: {}
    }
  }
  let genesisKey = await lotion(opts)(coin.handler)
  console.log(`lotion app listening on port ${opts.port}`)
  setTimeout(() => {
    client.send(privKey, {
      amount: 900,
      address:
        '1234123412341234123412341234123412341234123412341234123412341234'
    })
  }, 4000)
}

main()
