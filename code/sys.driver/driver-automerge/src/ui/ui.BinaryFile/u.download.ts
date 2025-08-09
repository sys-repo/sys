import { type t, Time } from './common.ts';
import { Binary } from './m.Binary.ts';

/**
 * Initiates a browser download of a single file.
 */
export function downloadFile(file: t.BinaryFile) {
  if (file == null) return;

  // Wrap bytes in a Blob and create an in-memory URL:
  const blob = new Blob([file.bytes], { type: file.type || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  // Create a temporary <a download> anchor link and click it:
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name; // filename in the "Save as..." dialog.
  document.body.appendChild(a);
  a.click(); // ← start the download.
  a.remove();

  // Tidy up the object-URL after the click has propagated.
  Time.delay(0, () => URL.revokeObjectURL(url));
}

/**
 * Drag-n-drop a file to the desktop of finder.
 */
export function dragdropFile(dt: DataTransfer, input: t.BinaryFile) {
  if (input == null) return;
  const file = Binary.toBrowserFile(input);

  /** Modern – Chrome 86+, Edge, Safari 17 */
  dt.items.add(file); // copies bytes into the drag payload

  /** Fallback (old Chrome / Electron) */
  const url = URL.createObjectURL(file);
  // Non-standard but still handy:
  dt.setData('DownloadURL', `${file.type}:${file.name}:${url}`);

  /** Plain-text name so other targets at least get a string. */
  dt.setData('text/plain', file.name);

  dt.effectAllowed = 'copy';
}
