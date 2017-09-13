<h1 align="center">
  <br>
  <a href="https://github.com/keppel/lotion-coin"><img src="https://user-images.githubusercontent.com/1269291/30399865-f25d4b54-9889-11e7-9bed-a11da0494fac.png" alt="Lotion" width="250"></a>
  <br>
      Lotion coin
  <br>
  <br>
</h1>

<h4 align="center">Friction-free framework for developing new cryptocurrencies. Built on Lotion.</h4>

<p align="center">
  <a href="https://travis-ci.org/keppel/lotion-coin">
    <img src="https://img.shields.io/travis/keppel/lotion-coin/master.svg"
         alt="Travis Build">
  </a>
  <a href="https://www.npmjs.com/package/lotion-coin">
    <img src="https://img.shields.io/npm/dm/lotion-coin.svg"
         alt="NPM Downloads">
  </a>
  <a href="https://www.npmjs.com/package/lotion-coin">
    <img src="https://img.shields.io/npm/v/lotion-coin.svg"
         alt="NPM Version">
  </a>
</p>
<br>

**Lotion coin** is a simple, extensible cryptocurrency library written for [Lotion](https://github.com/keppel/lotion).

With just a few lines of JavaScript, you can make your own new coin that behaves exactly how you want it to. 

Out of the box, `lotion-coin` supports addresses and send transactions, but you can arbitrarily extend your coin's functionality by using it from within a more complex [Lotion](https://github.com/keppel/lotion) state machine.

`lotion-coin` can be used as a node module, or as a cli if it's installed globally.

If your coin is going to have real value, please use [Cosmos SDK](https://github.com/cosmos/cosmos-sdk) instead of `lotion-coin`. The security of `lotion-coin` has not yet been evaluated.

## Usage

### Lotion app usage

```
npm install lotion lotion-coin
```

```js
let lotion = require('lotion')
let { handler, client } = require('lotion-coin')

let opts = {
  port: 3000
}

let app = lotion(opts)((state, tx) => {
  handler(state, tx)
})

```

### CLI usage

To initialize and run as a validator for a new currency:

```
npm install -g lotion-coin
```

```
Lcoin init
Lcoin start
```

That'll log a genesis key and start a validator node.

Users can use that genesis key to connect with:

```
Lcoin start <genesis key>
```

To send some coins, open another terminal window and run:

```
Lcoin send --address <recipient address> --amount 123
```

You can always open [http://localhost:3232](http://localhost:3232) while Lcoin is running to see the full JSON representation of the blockchain state from Lotion.

