import { formatNextStep } from './u.fmt.ts';

// The combined push task reaches this handoff only after both audience pushes succeed.
console.info();
console.info(formatNextStep('serve the published build', 'deno task serve'));
console.info();
