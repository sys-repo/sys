import React from 'react';
import { type t, Signal } from '../common.ts';
import { TreeHost } from '../ui.TreeHost/mod.ts';
import { D as TreeHostD } from '../ui.TreeHost/common.ts';
import { SlugClient } from '../../m.slug.client/mod.ts';

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

  const treeHostSlots = args.treeHostSlots;

  const buildTreeHostProps = (): t.TreeHostProps => {
    const base: t.TreeHostProps = {
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
    };
    return treeHostSlots ? { ...base, slots: treeHostSlots } : base;
  };

  const controller: t.SlugSheetController = {
    selectedPath,
    split,
    treeRoot,
    props() {
      const sheetSlots: t.SlugSheetSlots = {
        tree: <TreeHost.UI {...buildTreeHostProps()} />,
        main: treeHostSlots?.main,
        aux: treeHostSlots?.aux,
      };
      return {
        debug: args.debug,
        theme: args.theme,
        slots: sheetSlots,
      };
    },
    model() {
      return {
        treeHostProps: buildTreeHostProps(),
        slots: {
          main: treeHostSlots?.main,
          aux: treeHostSlots?.aux,
        },
        debug: args.debug,
        theme: args.theme,
      };
    },
    dispose() {
      disposed = true;
    },
  };

  return controller;
};
