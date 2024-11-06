import { ObjectLabel, ObjectPreview, ObjectRootLabel } from 'react-inspector';

type NodeRenderer = (args: NodeRendererArgs) => JSX.Element;
type NodeRendererArgs = {
  depth: number;
  name: string;
  data: any;
  isNonenumerable: boolean;
  expanded: boolean;
};

export function renderer(props: { showRootSummary: boolean }): NodeRenderer {
  return (args) => {
    const { depth, isNonenumerable, name, expanded } = args;

    if (depth === 0) {
      if (
        args.data === null ||
        args.data === undefined ||
        typeof args.data === 'boolean' ||
        typeof args.data === 'number' ||
        typeof args.data === 'string'
      ) {
        return <ObjectPreview data={args.data} />;
      }

      const data = expanded || !props.showRootSummary ? {} : args.data;
      return <ObjectRootLabel name={args.name} data={data} />;
    } else {
      return <ObjectLabel name={name} data={args.data} isNonenumerable={isNonenumerable} />;
    }
  };
}
