/* global FastBoot */
const isFastBoot = typeof FastBoot !== 'undefined';

var rng;

if (isFastBoot) {
  // Unique ID creation requires a high quality random # generator.  In node.js
  // this is pretty straight-forward - we use the crypto API.

  const rb = FastBoot.require('crypto').randomBytes;

  rng = () => rb(16);
} else {
  // Unique ID creation requires a high quality random # generator.  In the
  // browser this is a little complicated due to unknown quality of Math.random()
  // and inconsistent support for the `crypto` API.  We do the best we can via
  // feature-detection
  const crypto = window.crypto || window.msCrypto; // for IE 11

  if (crypto && crypto.getRandomValues) {
    // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
    const rnds8 = new Uint8Array(16);

    rng = () => {
      crypto.getRandomValues(rnds8);
      return rnds8;
    };
  }

  if (!rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    const  rnds = new Array(16);

    rng = () => {
      for (let i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) { r = Math.random() * 0x100000000; }
        rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return rnds;
    };
  }
}

export default rng;
