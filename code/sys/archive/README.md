# Archive

Strict, bounded inspection and integrity testing for archive bytes.

`@sys/archive/zip` accepts bytes, not paths. It has no filesystem authority and does not extract
files.

## ZIP32

```ts
import { Zip } from 'jsr:@sys/archive/zip';

async function examineZip(bytes: Uint8Array) {
  const archive = await Zip.open(bytes, {
    timeout: 30_000,
    limits: { maxEntries: 500 },
  });

  const inspection = archive.inspect();
  const integrity = await archive.test({ timeout: 30_000 });
  return { inspection, integrity };
}
```

### Meaning of success

| Operation           | Guarantee                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `Zip.open()`        | Copies the input and admits one structurally consistent archive and portable path tree.    |
| `archive.inspect()` | Returns frozen metadata. Sizes and CRC values remain archive claims until payload testing. |
| `archive.test()`    | Tests every file for complete decoding, exact compressed consumption, size, and CRC-32.    |

A passing test proves the internal consistency of the owned byte snapshot. CRC-32 is an error check,
not a cryptographic proof: success does not establish origin, authenticity, provenance, malware
safety, or trust in the decoded content.

### Supported subset

The reader is pinned to PKWARE APPNOTE 6.3.10 and deliberately accepts a narrow format:

| Dimension   | Accepted                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| Container   | One contiguous, single-disk ZIP32 archive                                |
| Compression | Stored or DEFLATE payloads                                               |
| Entries     | Ordinary files and directories using MS-DOS or Unix creator conventions  |
| Names       | Canonical UTF-8, or printable ASCII when the UTF-8 flag is absent        |
| Paths       | Relative, portable paths with unambiguous case and Unicode normalization |

Everything outside this subset fails closed. This includes ZIP64, encryption, split archives, links,
special files, unsafe or colliding paths, unsupported metadata, gaps, overlaps, and bytes before or
after the archive.

### Work bounds

Every asynchronous operation requires a finite `timeout` and accepts optional cancellation through
`until`. `Zip.open()` also accepts partial `limits`; omitted values retain these bounded defaults:

| Override           | Meaning                                  | Default |
| ------------------ | ---------------------------------------- | ------: |
| `maxSourceBytes`   | Input snapshot                           |  64 MiB |
| `maxEntries`       | Archive records                          |   2,048 |
| `maxTreeEntries`   | Files, directories, and implicit parents |   8,192 |
| `maxPathBytes`     | Raw bytes in one entry name              |     512 |
| `maxPathDepth`     | Components in one path                   |      32 |
| `maxEntryBytes`    | Expanded bytes in one file               | 128 MiB |
| `maxExpandedBytes` | Expanded bytes across all files          | 512 MiB |
| `maxErrorChars`    | Characters in one failure message        |  16,000 |

### Failures

Rejected operations throw owner-authenticated `ZipError` values. Use `Zip.Is.failure(error)` before
reading their stable `operation`, `kind`, and optional `entryIndex` fields.
