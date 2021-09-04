var Gen = require('../vendor/mersenne').MersenneTwister19937;

var fastSeedModeOn = function() {
  return process.env['FAKER_FAST_SEED_MODE_ON'] === 'true';
}

/**
  Fast seeded rng inspired by: https://stackoverflow.com/a/47593316/14905094
*/
function xmur3(str) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
    h = h << 13 | h >>> 19;

  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
}

function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

function getSeededSFC32 (str) {
  var seed = xmur3(str);
  // Output four 32-bit hashes to provide the seed for sfc32.
  var rand = sfc32(seed(), seed(), seed(), seed());

  return rand;
}

function Mersenne() {
  var gen;
  var currentTimeSeedInt = (new Date).getTime() % 1000000000;

  if (!fastSeedModeOn) {
    var innerGen = new Gen();
    innerGen.init_genrand(currentTimeSeedInt);

    gen = {
      getRandomNumber: function() {
        return innerGen.genrand_real2();
      },
      seed: function(S) {
        innerGen.init_genrand();
      },
      seed_array: function(A) {
        innerGen.init_by_array(A, A.length);
      }
    };
  } else {
    gen = {
      getRandomNumber: getSeededSFC32(currentTimeSeedInt.toString()),
      seed: function(S) {
        gen.getRandomNumber = getSeededSFC32(S.toString());
      },
      seed_array: function(A) {
        gen.getRandomNumber = getSeededSFC32(A.reduce((a, b) => a + b, 0).toString());
      }
    };
  }

  this.rand = function(max, min) {
    if (max === undefined) {
      min = 0;
      max = 32768;
    }

    return Math.floor(gen.getRandomNumber() * (max - min) + min);
  }
  this.seed = function(S) {
    if (typeof(S) != 'number')
    {
      throw new Error("seed(S) must take numeric argument; is " + typeof(S));
    }
    gen.seed(S);
  }
  this.seed_array = function(A) {
    if (typeof(A) != 'object')
    {
      throw new Error("seed_array(A) must take array of numbers; is " + typeof(A));
    }
    gen.seed_array(A, A.length);
  }
}

module.exports = Mersenne;
