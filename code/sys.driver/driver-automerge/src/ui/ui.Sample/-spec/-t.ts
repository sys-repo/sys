export * from '../../../common/t.ts';
export type { SampleProps } from '../ui.tsx';

export type SampleDoc = {
  count: number;
  msg?: string;
  cards: SampleCard[];
};

export type SampleCard = { title: string };
