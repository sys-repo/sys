import { pkg, Pkg } from '../common.ts';

export const index = `
# Hello World.

Generated with \`${Pkg.toString(pkg)}\`.

## Refs

- [jsr registry: @sys/driver-vitepress](https://jsr.io/@sys/driver-vitepress)
- [https://vitepress.dev](https://vitepress.dev)


## Topic

**Lorem ipsum** dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. 
Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit 
libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque. 
In sed quam mauris. Aenean mi nisl, elementum non arcu quis, ultrices tincidunt augue. 
Vivamus fermentum iaculis tellus finibus porttitor. Nulla eu purus id dolor auctor 
suscipit. Integer lacinia sapien at ante tempus volutpat.

## H2
### H3
#### H4

\`\`\`yaml
foo: 123
\`\`\`


`.slice(1);

export const Markdown = { index } as const;
