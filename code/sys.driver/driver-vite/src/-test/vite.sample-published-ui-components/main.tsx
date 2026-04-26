import { Button } from '@sys/ui-react-components/button';
import { useKeyboard } from '@sys/ui-react-devharness';
import { dirname, format, toNamespacedPath } from '@std/path';

const samplePath = dirname('/tmp/sample/file.ts');
const sampleFormat = format({ dir: '/tmp/sample', base: 'file.ts' });
const sampleNamespaced = toNamespacedPath('/tmp/sample/file.ts');

console.info(Button, useKeyboard, samplePath, sampleFormat, sampleNamespaced);
