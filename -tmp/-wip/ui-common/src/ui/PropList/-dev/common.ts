export { Icons } from '../../Icons.ts';
export * from '../common.ts';

export type MyField =
  | 'Module'
  | 'Module.Name'
  | 'Module.Version'
  | 'Module.Version.Diff'
  | 'Factory'
  | 'Factory.None'
  | 'Factory.Many'
  | 'Factory.EmptyArray'
  | 'Factory.Mixed';

export const SampleFields = {
  get all(): MyField[] {
    return [
      'Module',
      'Module.Name',
      'Module.Version',
      'Module.Version.Diff',
      'Factory',
      'Factory.None',
      'Factory.Many',
      'Factory.Mixed',
      'Factory.EmptyArray',
    ];
  },

  get defaults(): MyField[] {
    return ['Module.Name', 'Module.Version'];
  },
};
