/**
 * @module
 * Specimen-authoring adapters over production UI components.
 */
import type { t } from './common.ts';
import { DevHelp as Help } from './m.Help/mod.ts';
import { DevButton as Button } from './m.Button/mod.ts';
import { DevDivider as Divider } from './m.Divider/mod.ts';
import { ObjectView } from '../ui/ObjectView/mod.ts';
import { DevLink as Link } from './m.Link/mod.ts';
import { DevList as List } from './m.List/mod.ts';

/**
 * Callers own state and persistence; underlying components own interaction.
 */
export const Dev: t.Dev.Lib = {
  Button,
  Divider,
  Link,
  List,
  ObjectView,
  Help,
};
