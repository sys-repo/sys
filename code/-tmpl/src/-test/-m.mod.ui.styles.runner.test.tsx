import React from 'react';
import { DomMock, TestReact } from '@sys/ui-react/testing/server';
import { describe, expect, Is, it, Json } from '../-test.ts';
import { D, Time } from './styles.browser/common.ts';
import { StylesProof } from './styles.browser/ui.tsx';

/** Control-flow proof only: real iframe loading, pointer hit-testing and paint have browser proofs. */
describe('Scoped-style browser runner controls', () => {
  for (const receiptFails of [false, true]) {
    const name = receiptFails
      ? 'receipt rejection → visible ERROR, one delivery attempt, and controls recover'
      : 'empty version → click starts work, locks controls, reports ERROR, and permits another run';
    it(name, async () => {
      DomMock.polyfill();
      // HappyDOM interop: keep this UI test network-free; no baseline documents are loaded here.
      const mock = window as unknown as {
        happyDOM: { settings: { disableIframePageLoading: boolean } };
      };
      mock.happyDOM.settings.disableIframePageLoading = true;
      const originalFetch = globalThis.fetch;
      const posted: unknown[] = [];
      globalThis.fetch = (url, init) => {
        expect(String(url)).to.eql('http://127.0.0.1:1234/receipt');
        expect(init?.method).to.eql('POST');
        if (!Is.str(init?.body)) throw new Error('Expected the visible JSON as the receipt body');
        posted.push(Json.parse(init.body));
        return Promise.resolve(new Response('Unavailable', { status: 503 }));
      };
      try {
        const UI = () => <div data-component={D.displayName} />;
        using rendered = await TestReact.render(<StylesProof UI={UI} />);
        const { container } = rendered;
        if (receiptFails) {
          // Add delivery only after mount: exercise the button, not the optional auto-run effect.
          const url = new URL(document.location.href);
          url.searchParams.set('proof', 'http://127.0.0.1:1234/receipt');
          document.defaultView!.history.replaceState(null, '', url);
        }
        const button = Array.from(container.querySelectorAll('button')).find((el) =>
          el.textContent === 'Run comparisons'
        )!;
        const version = container.querySelector('input')!;
        const output = container.querySelector('textarea')!;
        const status = () => container.querySelector('[role="status"]')!.textContent;
        let ready = false;
        let reads = 0;
        let completedWaits = 0;
        const frames = Array.from(container.querySelectorAll('iframe'));
        for (const [index, frame] of frames.entries()) {
          const doc = document.implementation.createHTMLDocument();
          Object.defineProperty(frame, 'contentDocument', {
            get() {
              reads++;
              if (ready && index === frames.length - 1) completedWaits++;
              doc.documentElement.dataset.baselineReady = String(ready);
              return doc;
            },
          });
        }
        expect(version.value).to.eql('');
        expect(button.disabled).to.eql(false);
        expect(reads).to.eql(0);
        expect(status()).to.eql('Not run.');

        for (let run = 1; run <= 2; run++) {
          ready = false;
          const before = reads;
          await React.act(() => button.click());
          expect(reads).to.be.greaterThan(before);
          expect(status()).to.include('Running');
          for (const control of container.querySelectorAll('button, input, select')) {
            expect(control.hasAttribute('disabled')).to.eql(true);
          }
          await React.act(async () => {
            // Release the real waiter into deliberately incomplete documents: no fabricated paint.
            ready = true;
            await Time.waitFor(() => completedWaits >= run, { timeout: 1_000 });
          });
          const error = receiptFails
            ? 'Completion receipt: Error: Proof receipt failed: 503'
            : 'Error: Incorrect baseline arrangement: Light';
          expect(Json.parse(output.value)).to.include({
            result: 'ERROR',
            error,
            browserVersion: null,
          });
          expect(status()).to.eql(`ERROR — ${error}`);
          expect(posted.length).to.eql(receiptFails ? run : 0);
          if (receiptFails) {
            expect(posted[run - 1]).to.include({
              result: 'ERROR',
              error: 'Error: Incorrect baseline arrangement: Light',
              browserVersion: null,
            });
          }
          for (const control of container.querySelectorAll('button, input, select')) {
            expect(control.hasAttribute('disabled')).to.eql(false);
          }
        }
      } finally {
        globalThis.fetch = originalFetch;
        await DomMock.unpolyfill();
      }
    });
  }
});
