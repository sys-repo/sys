import { defaultTreeAdapter, parseFragment } from 'parse5';
import { example } from './u.example.ts';

export const hello = () => example(parseFragment, defaultTreeAdapter.isElementNode);
