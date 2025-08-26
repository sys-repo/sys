import { Type } from '../common.ts';

/**
 * IFrame:
 */
export const IFrame = Type.Object({
  src: Type.Optional(Type.String({ description: 'Href to the iframe source.' })),
  title: Type.Optional(Type.String({ description: 'Title of the iframe content.' })),
  name: Type.Optional(Type.String({ description: 'Name attribute for the iframe.' })),
  sandbox: Type.Optional(Type.Boolean({ description: 'Enable iframe sandbox mode.' })),
});
