import { CalcTimestamp as Timestamp } from '../ui/use.Timestamps.calc.ts';
import { CalcSection, CalcSection as Section } from './u.Calc.Section.ts';
export { CalcSection };

/**
 * Calculation helpers:
 */
export const Calc = {
  Section,
  Timestamp,
} as const;
