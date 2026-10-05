import { serveFileBytes } from '@sys/http/server/file-bytes';

const bytes = new TextEncoder().encode('verified');
const response = await serveFileBytes({
  req: new Request('http://local/verified.txt'),
  path: 'verified.txt',
  cache: 'no-store',
  read: () => Promise.resolve({ kind: 'bytes', bytes }),
});

if (response.status !== 200) throw new Error('File-byte entry did not return success.');
if (response.headers.get('content-type') !== 'text/plain; charset=UTF-8') {
  throw new Error('File-byte entry did not return the canonical MIME type.');
}
if (response.headers.get('content-length') !== String(bytes.byteLength)) {
  throw new Error('File-byte entry did not return the exact byte length.');
}
if (await response.text() !== 'verified') {
  throw new Error('File-byte entry did not preserve bytes.');
}

console.info('@sys/http/server/file-bytes denied-authority process proof passed.');
