let secp256k1 = require('secp256k1')
let { randomBytes } = require('crypto')
let createHash = require('sha.js')
let vstruct = require('varstruct')
let axios = require('axios')

let TxStruct = vstruct([
  { name: 'amount', type: vstruct.UInt64BE },
  { name: 'senderPubKey', type: vstruct.Buffer(33) },
  { name: 'senderAddress', type: vstruct.Buffer(32) },
  { name: 'receiverAddress', type: vstruct.Buffer(32) },
  { name: 'nonce', type: vstruct.UInt32BE }
])

exports.handler = function(state, rawTx) {
  let tx = deserializeTx(rawTx)
  if (!verifyTx(tx)) {
    return
  }

  let senderAddress = tx.senderAddress.toString('hex')
  let receiverAddress = tx.receiverAddress.toString('hex')

  let senderBalance = state.balances[senderAddress] || 0
  let receiverBalance = state.balances[receiverAddress] || 0

  if(senderAddress === receiverAddress) {
    return
  }
  if (!Number.isInteger(tx.amount)) {
    return
  }
  if (tx.amount > senderBalance) {
    return
  }
  if (tx.nonce !== (state.nonces[senderAddress] || 0)) {
    return
  }
  senderBalance -= tx.amount
  receiverBalance += tx.amount

  state.balances[senderAddress] = senderBalance
  state.balances[receiverAddress] = receiverBalance
  state.nonces[senderAddress] = (state.nonces[senderAddress] || 0) + 1
}

function hashTx(tx) {
  let txBytes = TxStruct.encode({
    amount: tx.amount,
    senderPubKey: tx.senderPubKey,
    senderAddress: tx.senderAddress,
    nonce: tx.nonce,
    receiverAddress: tx.receiverAddress
  })
  let txHash = createHash('sha256')
    .update(txBytes)
    .digest()

  return txHash
}

function signTx(privKey, tx) {
  let txHash = hashTx(tx)
  let signedTx = Object.assign({}, tx)
  let { signature } = secp256k1.sign(txHash, privKey)
  signedTx.signature = signature

  return signedTx
}

function verifyTx(tx) {
  if (
    deriveAddress(tx.senderPubKey).toString('hex') !==
    tx.senderAddress.toString('hex')
  ) {
    return false
  }
  let txHash = hashTx(tx)
  return secp256k1.verify(txHash, tx.signature, tx.senderPubKey)
}

function serializeTx(tx) {
  let serializable = Object.assign({}, tx)
  for (let key in tx) {
    if (Buffer.isBuffer(tx[key])) {
      serializable[key] = tx[key].toString('base64')
    }
  }
  return serializable
}

function deserializeTx(tx) {
  let deserialized = tx
  ;[
    'senderPubKey',
    'senderAddress',
    'receiverAddress',
    'signature'
  ].forEach(key => {
    deserialized[key] = Buffer.from(deserialized[key], 'base64')
  })

  return deserialized
}

function deriveAddress(pubKey) {
  return createHash('sha256')
    .update(pubKey)
    .digest()
}

exports.client = function(url = 'http://localhost:3232') {
  let methods = {
    generatePrivateKey: () => {
      let privKey
      do {
        privKey = randomBytes(32)
      } while (!secp256k1.privateKeyVerify(privKey))

      return privKey
    },
    generatePublicKey: privKey => {
      return secp256k1.publicKeyCreate(privKey)
    },
    generateAddress: pubKey => {
      return deriveAddress(pubKey)
    },
    getBalance: async (address) => {
      let state = await axios.get(url + '/state').then(res => res.data)
      return state.balances[address] || 0
    },
    send: async (privKey, { address, amount }) => {
      let senderPubKey = methods.generatePublicKey(privKey)
      let senderAddress = methods.generateAddress(senderPubKey)

      let currentState = await axios.get(url + '/state').then(res => res.data)

      let nonce = currentState.nonces[senderAddress.toString('hex')] || 0

      let receiverAddress
      if (typeof address === 'string') {
        receiverAddress = Buffer.from(address, 'hex')
      } else {
        receiverAddress = address
      }
      let tx = {
        amount,
        senderPubKey,
        senderAddress,
        receiverAddress,
        nonce
      }

      let signedTx = signTx(privKey, tx)
      let serializedTx = serializeTx(signedTx)
      let result = await axios.post(url + '/txs', serializedTx)
      return result.data
    }
  }

  return methods
}
