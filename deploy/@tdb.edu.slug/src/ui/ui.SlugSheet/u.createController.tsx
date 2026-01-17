import React from 'react';
import { type t, Color, css, Signal } from '../common.ts';
import { TreeHost } from '../ui.TreeHost/mod.ts';
import { D as TreeHostD } from '../ui.TreeHost/common.ts';
import { SlugClient } from '../../m.slug.client/mod.ts';

const Styles = {
  treeMain: css({
    display: 'grid',
    placeItems: 'center',
    padding: 12,
    fontSize: 14,
  }),
  treeAux: css({
    display: 'grid',
    placeItems: 'center',
    padding: 8,
    fontSize: 12,
    color: Color.alpha(Color.BLACK, 0.5),
  }),
  sheetMain: css({
    display: 'grid',
    placeItems: 'center',
    minHeight: 120,
    fontSize: 16,
    color: Color.alpha(Color.BLACK, 0.6),
  }),
};

export const createController: t.SlugSheetControllerLib['create'] = (args) => {
  let disposed = false;

  const selectedPath = Signal.create<t.ObjectPath | undefined>(undefined);
  const split = Signal.create<t.Percent[]>(args.split ?? TreeHostD.split);
  const treeRoot = Signal.create<t.TreeNodeList | undefined>(args.root);

  if (!treeRoot.value && args.baseUrl && args.docId) {
    loadTree(args.baseUrl, args.docId);
  }

  async function loadTree(baseUrl: t.StringUrl, docId: string) {
    const res = await SlugClient.loadTreeFromEndpoint(baseUrl, docId);
    if (disposed || !res.ok || !res.value) return;
    treeRoot.value = TreeHost.Data.fromSlugTree(res.value);
  }

  const treeHostSlots: t.TreeHostSlots = {
    main: <div className={Styles.treeMain.class}>Hello world</div>,
    aux: <div className={Styles.treeAux.class}>Auxiliary slot</div>,
  };

  const buildTreeHostProps = (): t.TreeHostProps => ({
    debug: args.debug,
    theme: args.theme,
    root: treeRoot.value,
    split: split.value,
    selectedPath: selectedPath.value,
    onPathChange: ({ path }) => {
      selectedPath.value = path;
    },
    onSplitChange: (e) => {
      split.value = e.split;
    },
    slots: treeHostSlots,
  });

  const controller: t.SlugSheetController = {
    selectedPath,
    split,
    treeRoot,
    props() {
      return {
        debug: args.debug,
        theme: args.theme,
        slots: {
          tree: <TreeHost.UI {...buildTreeHostProps()} />,
          main: treeHostSlots.main,
          aux: treeHostSlots.aux,
        },
      };
    },
    model() {
      return {
        treeHostProps: buildTreeHostProps(),
        slots: { main: treeHostSlots.main, aux: treeHostSlots.aux },
        debug: args.debug,
        theme: args.theme,
      };
    },
    dispose(_reason) {
      disposed = true;
    },
  };

  return controller;
};
