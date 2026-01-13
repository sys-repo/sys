import { Color, Str } from '../common.ts';

export const TEMPLATE = Str.dedent(`
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Index</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          margin: 0;
          padding: 24px 80px;
          font-family: sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: ${Color.DARK};
        }
        ul { padding-left: 1.2em; }
        li {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        hr {
          border: none;
          border-top: 1px dashed ${Color.alpha(Color.DARK, 0.2)};
          margin: 16px 0;
        }
        a {
          color: ${Color.BLUE};
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline ${Color.alpha(Color.DARK, 0.1)};
          text-underline-offset: 0.25em;
        }
        .version {
          color: ${Color.alpha(Color.DARK, 0.3)};
          font-family: monospace;
          font-size: 11px;
          font-weight: 600;
          margin-right: 4px;
        }
      </style>
    </head>
    <body>
      <ul>
__LIST__
        <li><a href="./dist.json" class="version">dist.json</a></li>
      </ul>
    </body>
  </html>
`);
