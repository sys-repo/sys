import { useEffect, useState, FunctionComponent } from 'react';

/**
 * Dynamically import a component to take advantage
 * of code-splitting.
 */
export function useImporter<P>(importer: Promise<{ default: any }>) {
  type FC = FunctionComponent<P>;
  const [Component, setComponent] = useState<{ Spinner: FC }>();

  /**
   * [Lifecycle]: code-splitting.
   */
  useEffect(() => {
    importer.then(({ default: Spinner }) => setComponent({ Spinner }));
  }, []);

  return {
    Spinner: Component?.Spinner,
  };
}
