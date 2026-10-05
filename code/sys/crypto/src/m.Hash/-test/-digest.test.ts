import { describe, expect, it } from '../../-test.ts';
import { Hash } from '../mod.ts';

describe('Hash digest output', () => {
  // Fixed vectors calculated with Web Crypto, independently of Hash and its encoders.
  const ascii = {
    name: 'ASCII',
    input: 'abc',
    sha1: {
      hex: 'a9993e364706816aba3e25717850c26c9cd0d89d',
      base64: 'qZk+NkcGgWq6PiVxeFDCbJzQ2J0=',
    },
    sha256: {
      hex: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      base64: 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=',
    },
  };
  const binary = {
    name: 'binary',
    input: new Uint8Array([0, 255, 128, 1, 2, 3]),
    sha1: {
      hex: '5a90f0c7ae53867e9deb8e22e74caf6463c85a1d',
      base64: 'WpDwx65Thn6d644i50yvZGPIWh0=',
    },
    sha256: {
      hex: '23d65ea0eba723b11cc9382350d0ab3756eedeef67957f1a341d629c58cbde77',
      base64: 'I9ZeoOunI7EcyTgjUNCrN1bu3u9nlX8aNB1inFjL3nc=',
    },
  };
  const vectors = [
    {
      name: 'empty',
      input: '',
      sha1: {
        hex: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
        base64: '2jmj7l5rSw0yVb/vlWAYkK/YBwk=',
      },
      sha256: {
        hex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        base64: '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
      },
    },
    ascii,
    {
      name: 'Unicode',
      input: 'é✓',
      sha1: {
        hex: '44dcf208ec885cd723e88906064a019f56644c02',
        base64: 'RNzyCOyIXNcj6IkGBkoBn1ZkTAI=',
      },
      sha256: {
        hex: '1e77cb71920ad52885fab06465a5fcf2e5f98c0382aab36202689431b93b9fb3',
        base64: 'HnfLcZIK1SiF+rBkZaX88uX5jAOCqrNiAmiUMbk7n7M=',
      },
    },
    binary,
    { ...binary, name: 'ArrayBuffer', input: binary.input.buffer },
    {
      ...binary,
      name: 'byte view excludes surrounding bytes',
      input: new Uint8Array([9, 0, 255, 128, 1, 2, 3, 9]).subarray(1, 7),
    },
  ];

  for (const algorithm of ['sha1', 'sha256'] as const) {
    const hash = Hash[algorithm];
    for (const vector of vectors) {
      it(`${algorithm}: ${vector.name} → default and explicit hex`, () => {
        const { input } = vector;
        const { hex } = vector[algorithm];
        const prefixed = `${algorithm}-${hex}`;

        expect(hash(input)).to.eql(prefixed);
        expect(hash(input, { prefix: false })).to.eql(hex);
        expect(hash(input, { encoding: 'hex' })).to.eql(prefixed);
        expect(hash(input, { encoding: 'hex', prefix: true })).to.eql(prefixed);
        expect(hash(input, { encoding: 'hex', prefix: false })).to.eql(hex);
      });

      it(`${algorithm}: ${vector.name} → Base64 of raw digest bytes`, () => {
        const { input } = vector;
        const { base64 } = vector[algorithm];
        const prefixed = `${algorithm}-${base64}`;

        expect(hash(input, { encoding: 'base64' })).to.eql(prefixed);
        expect(hash(input, { encoding: 'base64', prefix: true })).to.eql(prefixed);
        expect(hash(input, { encoding: 'base64', prefix: false })).to.eql(base64);
      });
    }

    for (const encoding of ['hex', 'base64'] as const) {
      it(`${algorithm}: asString conversion precedes ${encoding} digest output`, () => {
        const options = { encoding, prefix: false, asString: () => 'abc' };
        const actual = hash(123, options);
        expect(actual).to.eql(ascii[algorithm][encoding]);
      });
    }
  }
});
