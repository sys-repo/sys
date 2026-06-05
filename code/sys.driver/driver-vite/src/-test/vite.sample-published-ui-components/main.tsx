import { Button } from '@sys/ui-components/react/button';
import { useKeyboard } from '@sys/ui-dev/react/devharness/hooks';
import { dirname, format, toNamespacedPath } from '@std/path';

const samplePath = dirname('/tmp/sample/file.ts');
const sampleFormat = format({ dir: '/tmp/sample', base: 'file.ts' });
const sampleNamespaced = toNamespacedPath('/tmp/sample/file.ts');

console.info(Button, useKeyboard, samplePath, sampleFormat, sampleNamespaced);
