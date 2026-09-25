import { Is } from '@sys/std/is';

if (!Is.browser()) throw new Error('Expected the universal Is surface to detect Chrome.');
if (!Is.string('universal')) throw new Error('Expected Is.string to execute in Chrome.');
if (!Is.number(42)) throw new Error('Expected Is.number to execute in Chrome.');
if (!Is.promise(Promise.resolve())) throw new Error('Expected Is.promise to execute in Chrome.');
if (!Is.uint8Array(new Uint8Array())) {
  throw new Error('Expected Is.uint8Array to execute in Chrome.');
}
if ('Native' in Is) throw new Error('Universal Is leaked the server-only Native namespace.');

const proof = await fetch('/proof/std-is-universal', { method: 'POST' });
if (!proof.ok) throw new Error(`Universal Is proof signal failed with HTTP ${proof.status}.`);
