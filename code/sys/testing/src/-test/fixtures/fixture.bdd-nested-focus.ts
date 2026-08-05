import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

const suite = describe('BDD fixture → nested focus through a registered suite handle', {
  only: false,
});

it(suite, 'unfocused sibling', () => console.info(BddMarker.nestedFocusSibling));
it.only(suite, 'focused leaf', () => console.info(BddMarker.nestedFocus));
