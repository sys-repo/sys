/**
 * @module
 * Dev-only React composition primitives built from system UI components.
 */
import type { t } from './common.ts';
import { DevHelp as Help } from './m.Help/mod.ts';
import { DevButton as Button } from './ui.Button.tsx';
import { DevDivider as Divider } from './ui.Divider.tsx';
import { ObjectView } from '../ui/ObjectView/mod.ts';
import { DevLink as Link } from './ui.Link.tsx';
import { DevList as List } from './ui.List.tsx';

/**
 * Dev-only composition primitive surface.
 */
export const Dev: t.Dev.Lib = { Help, Button, Divider, ObjectView, Link, List };
