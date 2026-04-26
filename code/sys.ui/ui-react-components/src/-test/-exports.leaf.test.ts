import { describe, expect, it } from '../-test.ts';

import { pkg } from '../pkg.ts';

import { ActionProbe } from '../ui/ActionProbe/mod.ts';
import { A, Anchor } from '../ui/Anchor/mod.ts';
import { Bullet } from '../ui/Bullet/mod.ts';
import { BulletList } from '../ui/BulletList/mod.ts';
import { Button } from '../ui/Button/mod.ts';
import { IconButtons } from '../ui/Buttons.Icons/mod.ts';
import { Switch, SwitchTheme } from '../ui/Buttons.Switch/mod.ts';
import { Buttons } from '../ui/Buttons/mod.ts';
import { Cropmarks } from '../ui/Cropmarks/mod.ts';
import { ErrorBoundary } from '../ui/ErrorBoundary/mod.ts';
import { FadeElement } from '../ui/FadeElement/mod.ts';
import { HttpOrigin } from '../ui/Http.Origin/mod.ts';
import { IconSwatches } from '../ui/Icon.Swatches/mod.ts';
import { Icon } from '../ui/Icon/mod.ts';
import { IFrame } from '../ui/IFrame/mod.ts';
import { Svg } from '../ui/Image.Svg/mod.ts';
import { KeyValue } from '../ui/KeyValue/mod.ts';
import { CenterColumn } from '../ui/Layout.CenterColumn/mod.ts';
import { RectGrid } from '../ui/Layout.RectGrid/mod.ts';
import { SplitPane } from '../ui/Layout.SplitPane/mod.ts';
import { Tabs } from '../ui/Layout.Tabs/mod.ts';
import { TreeHost } from '../ui/Layout.TreeHost/mod.ts';
import { Media } from '../ui/Media/mod.ts';
import { ObjectView } from '../ui/ObjectView/mod.ts';
import { PathView } from '../ui/PathView/mod.ts';
import { Player } from '../ui/Player/mod.ts';
import { YouTube } from '../ui/Player.YouTube/mod.ts';
import { Preload } from '../ui/Preload/mod.ts';
import { Prose } from '../ui/Prose/mod.ts';
import { Sheet } from '../ui/Sheet/mod.ts';
import { Slider } from '../ui/Slider/mod.ts';
import { Spinners } from '../ui/Spinners/mod.ts';
import { IndexTreeView } from '../ui/TreeView.Index/mod.ts';
import { TreeView } from '../ui/TreeView/mod.ts';
import { VimeoBackground } from '../ui/VimeoBackground/mod.ts';

describe('@sys/ui-react-components leaf exports', () => {
  it('keeps the root export minimal and package-only', async () => {
    const root = await import('@sys/ui-react-components');
    expect(root.pkg).to.equal(pkg);
    expect('Button' in root).to.eql(false);
    expect('Media' in root).to.eql(false);
    expect('TreeView' in root).to.eql(false);
    expect('t' in root).to.eql(false);
  });

  it('exports the core component leaves', async () => {
    const [
      actionProbe,
      anchor,
      bullet,
      bulletList,
      button,
      buttons,
      iconButtons,
      switchButtons,
      cropmarks,
      errorBoundary,
      fadeElement,
      httpOrigin,
      icon,
      iconSwatches,
      iframe,
      imageSvg,
      keyValue,
      objectView,
      pathView,
      preload,
      prose,
      sheet,
      slider,
      spinners,
      treeView,
      treeViewIndex,
      vimeoBackground,
    ] = await Promise.all([
      import('@sys/ui-react-components/action-probe'),
      import('@sys/ui-react-components/anchor'),
      import('@sys/ui-react-components/bullet'),
      import('@sys/ui-react-components/bullet-list'),
      import('@sys/ui-react-components/button'),
      import('@sys/ui-react-components/buttons'),
      import('@sys/ui-react-components/buttons/icons'),
      import('@sys/ui-react-components/buttons/switch'),
      import('@sys/ui-react-components/cropmarks'),
      import('@sys/ui-react-components/error-boundary'),
      import('@sys/ui-react-components/fade-element'),
      import('@sys/ui-react-components/http-origin'),
      import('@sys/ui-react-components/icon'),
      import('@sys/ui-react-components/icon-swatches'),
      import('@sys/ui-react-components/iframe'),
      import('@sys/ui-react-components/image/svg'),
      import('@sys/ui-react-components/key-value'),
      import('@sys/ui-react-components/object-view'),
      import('@sys/ui-react-components/path-view'),
      import('@sys/ui-react-components/preload'),
      import('@sys/ui-react-components/prose'),
      import('@sys/ui-react-components/sheet'),
      import('@sys/ui-react-components/slider'),
      import('@sys/ui-react-components/spinners'),
      import('@sys/ui-react-components/tree-view'),
      import('@sys/ui-react-components/tree-view/index'),
      import('@sys/ui-react-components/vimeo-background'),
    ]);

    expect(actionProbe.ActionProbe).to.equal(ActionProbe);
    expect(anchor.A).to.equal(A);
    expect(anchor.Anchor).to.equal(Anchor);
    expect(bullet.Bullet).to.equal(Bullet);
    expect(bulletList.BulletList).to.equal(BulletList);
    expect(button.Button).to.equal(Button);
    expect(buttons.Buttons).to.equal(Buttons);
    expect(iconButtons.IconButtons).to.equal(IconButtons);
    expect(switchButtons.Switch).to.equal(Switch);
    expect(switchButtons.SwitchTheme).to.equal(SwitchTheme);
    expect(cropmarks.Cropmarks).to.equal(Cropmarks);
    expect(errorBoundary.ErrorBoundary).to.equal(ErrorBoundary);
    expect(fadeElement.FadeElement).to.equal(FadeElement);
    expect(httpOrigin.HttpOrigin).to.equal(HttpOrigin);
    expect(icon.Icon).to.equal(Icon);
    expect(iconSwatches.IconSwatches).to.equal(IconSwatches);
    expect(iframe.IFrame).to.equal(IFrame);
    expect(imageSvg.Svg).to.equal(Svg);
    expect(keyValue.KeyValue).to.equal(KeyValue);
    expect(objectView.ObjectView).to.equal(ObjectView);
    expect(pathView.PathView).to.equal(PathView);
    expect(preload.Preload).to.equal(Preload);
    expect(prose.Prose).to.equal(Prose);
    expect(sheet.Sheet).to.equal(Sheet);
    expect(slider.Slider).to.equal(Slider);
    expect(spinners.Spinners).to.equal(Spinners);
    expect(treeView.TreeView).to.equal(TreeView);
    expect(treeViewIndex.IndexTreeView).to.equal(IndexTreeView);
    expect(vimeoBackground.VimeoBackground).to.equal(VimeoBackground);
  });

  it('exports the layout and player leaves', async () => {
    const [centerColumn, rectGrid, splitPane, tabs, treeHost, media, player, youTube] = await Promise.all([
      import('@sys/ui-react-components/layout/center-column'),
      import('@sys/ui-react-components/layout/rect-grid'),
      import('@sys/ui-react-components/layout/split-pane'),
      import('@sys/ui-react-components/layout/tabs'),
      import('@sys/ui-react-components/layout/tree-host'),
      import('@sys/ui-react-components/media'),
      import('@sys/ui-react-components/player'),
      import('@sys/ui-react-components/player/youtube'),
    ]);

    expect(centerColumn.CenterColumn).to.equal(CenterColumn);
    expect(rectGrid.RectGrid).to.equal(RectGrid);
    expect(splitPane.SplitPane).to.equal(SplitPane);
    expect(tabs.Tabs).to.equal(Tabs);
    expect(treeHost.TreeHost).to.equal(TreeHost);
    expect(media.Media).to.equal(Media);
    expect(player.Player).to.equal(Player);
    expect(youTube.YouTube).to.equal(YouTube);
  });
});
