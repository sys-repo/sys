export const nav = `
import type { DefaultTheme } from 'vitepress';

/**
 * Left sidebar navigation.
 *
 * Documentation:
 * https://vitepress.dev/reference/default-theme-sidebar
 */
export const sidebar: DefaultTheme.Sidebar = [
  {
    text: 'Section Title A',
    items: [
      { text: 'Item-A', link: 'section-a/item-a' },
      { text: 'Item-B', link: 'section-a/item-b' },
    ],
  },
];
`.slice(1);
