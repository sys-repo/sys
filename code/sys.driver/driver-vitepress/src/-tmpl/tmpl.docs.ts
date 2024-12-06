import { pkg, Pkg } from '../common.ts';
const LOREM = `**Lorem ipsum** dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque. In sed quam mauris. Aenean mi nisl, elementum non arcu quis, ultrices tincidunt augue. Vivamus fermentum iaculis tellus finibus porttitor. Nulla eu purus id dolor auctor suscipit. Integer lacinia sapien at ante tempus volutpat.`;

/**
 * Sample index page.
 */
export const index = `
# 👋 Hello World

Generated with \`${Pkg.toString(pkg)}\`.  
Sample throw-away content.

<Sample/>
<Video id="1234" />
<ReactWrapper />

## Refs
- [jsr registry → @sys/driver-vitepress](https://jsr.io/@sys/driver-vitepress)
- [https://vitepress.dev](https://vitepress.dev)

## Topic
${LOREM}

## H2
### H3
#### H4

\`\`\`yaml
foo: 123
\`\`\`
`.slice(1);

/**
 * Sample page.
 */
export function sample(args: { title?: string; lorem?: boolean }) {
  const { title = 'Foo', lorem = true } = args;
  return `
# ${title}  

${lorem ? LOREM : ''}
  `.slice(1);
}

export const Docs = {
  md: { index, sample },
} as const;
