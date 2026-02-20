import { type t, describe, it, expect, expectTypeOf } from '../../../-test.ts';
import { Mime } from '../mod.ts';

describe('MIME-types', () => {
  const as = <X>() => null as any as X;

  it('maps file extensions to the correct MIME-type', () => {
    const map = Mime.extensionMap;

    // Images
    expect(map.png).to.equal('image/png');
    expect(map.jpg).to.equal('image/jpeg');
    expect(map.jpeg).to.equal('image/jpeg');
    expect(map.webp).to.equal('image/webp');
    expect(map.svg).to.equal('image/svg+xml');
    expect(map.ico).to.equal('image/x-icon');

    // Video
    expect(map.webm).to.equal('video/webm');
    expect(map.mp4).to.equal('video/mp4');

    // Documents
    expect(map.pdf).to.equal('application/pdf');
    expect(map.json).to.equal('application/json');
    expect(map.yaml).to.equal('application/yaml');
    expect(map.yml).to.equal('application/yaml');

    // Text / HTML
    expect(map.txt).to.equal('text/plain');
    expect(map.html).to.equal('text/html');
    expect(map.htm).to.equal('text/html');

    // Code
    expect(map.js).to.equal('application/javascript');
    expect(map.mjs).to.equal('application/javascript');
    expect(map.wasm).to.equal('application/wasm');
  });

  it('type-level: extension map yields valid MimeType values', () => {
    type FromExtMap = (typeof Mime.extensionMap)[string];

    expectTypeOf(as<FromExtMap>()).toEqualTypeOf<t.ServeTool.MimeType>();
  });
});
