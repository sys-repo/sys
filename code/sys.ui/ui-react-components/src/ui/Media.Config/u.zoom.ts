import { type t, D } from './common.ts';

export const values: t.MediaZoomLib['values'] = (keys) => {
  const res: Partial<t.MediaZoomValues> = {};
  keys.forEach((k) => (res[k] = D.zoom[k].initial));
  return res;
};

export const toRatio: t.MediaZoomLib['toRatio'] = (input = {}) => {
  const {
    factor = D.zoom.factor.initial,
    centerX = D.zoom.centerX.initial,
    centerY = D.zoom.centerY.initial,
  } = input;
  return {
    factor: factor / 100,
    centerX: centerX / 100,
    centerY: centerY / 100,
  };
};

export const fromRatio: t.MediaZoomLib['fromRatio'] = (input = {}) => {
  const {
    factor = D.zoom.factor.initial / 100,
    centerX = D.zoom.centerX.initial / 100,
    centerY = D.zoom.centerY.initial / 100,
  } = input;
  return {
    factor: factor * 100,
    centerX: centerX * 100,
    centerY: centerY * 100,
  };
};
