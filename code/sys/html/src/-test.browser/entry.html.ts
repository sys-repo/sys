import { Html } from '@sys/html';
import { example } from './u.example.ts';

export const hello = () => example(Html.parseFragment, Html.Is.element);
