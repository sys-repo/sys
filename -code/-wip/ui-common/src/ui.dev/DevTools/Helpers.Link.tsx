import { DevIcons, type t } from '../common';

type O = Record<string, unknown>;

/**
 * Link dev-harness helpers.
 */
export const Link = {
  button<T extends O>(pkg: t.ModuleDef, dev: t.DevTools<T>, label: string, target: string) {
    const elIconLeft = <DevIcons.Link size={18} offset={[0, 2]} />;
    const elIconRight = <DevIcons.NewTab size={16} />;
    const targetIsUrl = target.startsWith('https://') || target.startsWith('http://');
    dev.button((btn) => {
      btn
        .label(label)
        .icon((e) => elIconLeft)
        .right((e) => elIconRight)
        .onClick((e) => {
          const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');
          if (targetIsUrl) {
            open(target);
          } else {
            target = target.replace(/^\?/, '');
            const url = new URL(location.href);
            url.searchParams.set('dev', `${pkg.name}.${target}`);
            open(url.href);
          }
        });
    });
  },

  /**
   * Curried helper.
   */
  pkg<T extends O>(pkg: t.ModuleDef, dev: t.DevTools<T>) {
    const api: t.DevLinks = {
      button(label, target) {
        Link.button(pkg, dev, label, target);
        return api;
      },
      hr(line = -1, margin) {
        dev.hr(line, margin);
        return api;
      },
      title(text) {
        dev.title(text);
        return api;
      },
    } as const;
    return api;
  },
} as const;
