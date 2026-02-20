import { type t, describe, it, expect, expectTypeOf } from '../../../-test.ts';
import { Mime } from '../mod.ts';

describe('MIME-types', () => {
  const as = <X>() => null as any as X;

  it('maps groups to the underlying MIME lists', () => {
    expect(Mime.groups.images).to.eql(Mime.images);
    expect(Mime.groups.videos).to.eql(Mime.videos);
    expect(Mime.groups.documents).to.eql(Mime.documents);
    expect(Mime.groups.code).to.eql(Mime.code);
    expect(Mime.groups.text).to.eql(Mime.text);
  });

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

  it('type-level: groups and extension maps yield valid MimeType values', () => {
    type FromGroups =
      | (typeof Mime.images)[number]
      | (typeof Mime.videos)[number]
      | (typeof Mime.documents)[number]
      | (typeof Mime.code)[number]
      | (typeof Mime.text)[number];

    type FromExtMap = (typeof Mime.extensionMap)[string];

    expectTypeOf(as<FromGroups>()).toEqualTypeOf<t.ServeTool.MimeType>();
    expectTypeOf(as<FromExtMap>()).toEqualTypeOf<t.ServeTool.MimeType>();
  });

  it('composes known MIME types from selected MimeGroup values', () => {
    const selectedGroups: readonly t.ServeTool.MimeGroup[] = ['images', 'text'];

    const types: t.ServeTool.MimeType[] = [];
    for (const group of selectedGroups) {
      types.push(...Mime.groups[group]);
    }

    // Expect exact concatenation of the configured groups.
    expect(types).to.eql([
      // images:
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      // text:
      'text/plain',
      'text/html',
      'text/css',
    ] as t.ServeTool.MimeType[]);
  });
});
