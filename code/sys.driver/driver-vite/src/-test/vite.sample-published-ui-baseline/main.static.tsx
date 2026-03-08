/**
 * Variant: Static imports
 */
import { Dom, Keyboard } from '@sys/ui-dom';
import { UserAgent } from '@sys/ui-dom/user-agent';
import { LocalStorage } from '@sys/ui-dom/local-storage';
import { css, Style } from '@sys/ui-css';
import { Signal, FC } from '@sys/ui-react';

async function main() {
  console.info(Dom, Keyboard, UserAgent, LocalStorage);
  console.info(css, Style);
  console.info(Signal, FC);
}

await main();
