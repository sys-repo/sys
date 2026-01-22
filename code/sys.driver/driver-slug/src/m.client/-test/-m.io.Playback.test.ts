import { describe, expect, it } from '../../-test.ts';
import { SlugClient, SlugUrl } from '../mod.ts';
import { Playback } from '../m.io.Playback.ts';

import type { t } from '../common.ts';
import { D } from '../common.ts';
import { jsonResponse, stubFetch, textResponse } from './u.fixture.ts';

describe('SlugClient.FromEndpoint.Playback.load', () => {
  it('is the SlugClient playback loader', () => {
    expect(SlugClient.FromEndpoint.Playback).to.equal(Playback);
  });

  it('loads playback manifest (happy path)', async () => {
    const docid = 'crdt:playback-happy' as t.StringId;
    const cleaned = SlugUrl.clean(docid);
    const manifest: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
      beats: [
        {
          src: { kind: 'video', logicalPath: '/video/main', time: 0 as t.Msecs },
          payload: null,
        },
      ],
    };
    const seenUrl: string[] = [];
    const cleanup = stubFetch((url) => {
      seenUrl.push(url);
      if (url.includes(SlugUrl.playbackFilename(cleaned))) return jsonResponse(manifest);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Playback.load('http://example.com/', docid);
      if (!result.ok) throw new Error('expected playback result');
      expect(result.ok).to.eql(true);
      expect(result.value).to.eql(manifest);
      expect(seenUrl[0]).to.include(SlugUrl.playbackFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('passes RequestInit extras but enforces cache policy', async () => {
    const docid = 'crdt:playback-init' as t.StringId;
    const cleaned = SlugUrl.clean(docid);
    const manifest: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
      beats: [],
    };
    let seenInit: RequestInit | undefined;
    const cleanup = stubFetch((url, init) => {
      if (url.includes(SlugUrl.playbackFilename(cleaned))) {
        seenInit = init;
        return jsonResponse(manifest);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const init: RequestInit = {
        method: 'PUT',
        headers: { 'x-signal': 'ok' },
        cache: 'reload',
      };
      const result = await Playback.load('http://example.com/', docid, { init });
      if (!result.ok) throw new Error('expected playback result');
      const headers = seenInit?.headers;
      const headerValue =
        headers instanceof Headers
          ? headers.get('x-signal')
          : headers && typeof headers === 'object' && !Array.isArray(headers)
          ? (headers as Record<string, string>)['x-signal']
          : undefined;
      expect(seenInit?.method).to.equal('PUT');
      expect(headerValue).to.eql('ok');
      expect(seenInit?.cache).to.eql(D.CACHE_INIT.cache);
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when fetch fails', async () => {
    const docid = 'crdt:playback-http' as t.StringId;
    const cleaned = SlugUrl.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugUrl.playbackFilename(cleaned)))
        return textResponse('Not Found', { status: 404, statusText: 'Not Found' });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Playback.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected http error');
      expect(result.error.kind).to.equal('http');
      if (result.error.kind !== 'http') throw new Error('expected http failure');
      expect(result.error.status).to.equal(404);
      expect(result.error.url).to.include(SlugUrl.playbackFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('returns schema info when manifest is invalid', async () => {
    const docid = 'crdt:playback-schema' as t.StringId;
    const cleaned = SlugUrl.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugUrl.playbackFilename(cleaned)))
        return jsonResponse({
          docid: cleaned,
          composition: [],
          beats: 'not-an-array',
        });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Playback.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema error');
      expect(result.error.kind).to.equal('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema failure');
      expect(result.error.message).to.include('Playback manifest failed');
    } finally {
      cleanup();
    }
  });

  it('reports schema errors when docids do not match', async () => {
    const docid = 'crdt:playback-mismatch' as t.StringId;
    const cleaned = SlugUrl.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugUrl.playbackFilename(cleaned)))
        return jsonResponse({
          docid: 'other-playback',
          composition: [],
          beats: [],
        });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Playback.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected docid mismatch');
      expect(result.error.kind).to.equal('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema mismatch');
      expect(result.error.message).to.include('docid mismatch');
      expect(result.error.message).to.include(cleaned);
      expect(result.error.message).to.include('other-playback');
    } finally {
      cleanup();
    }
  });
});
