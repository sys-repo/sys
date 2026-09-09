export { Testing } from '@sys/testing/server';
export { DomMock } from '@sys/testing/server/dom';
export * from '../common.ts';

const globalEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

globalEnv.IS_REACT_ACT_ENVIRONMENT = true;
