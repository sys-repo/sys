import { describe, expect, it, Json } from '../-test.ts';
import { type Comparison, createReport } from './styles.browser/u.report.ts';

const metadata = { browserVersion: '', userAgent: 'test', ruleFailures: [] };
const sample = (actual: Record<string, string>, baseline = actual): Comparison => ({
  phase: 'isolated Light',
  id: 'a/none',
  key: 'Light/none',
  actual,
  baseline,
  differences: Object.keys(baseline).filter((name) => actual[name] !== baseline[name]),
});

describe('Scoped-style browser reports', () => {
  it('shared snapshots → complete values survive JSON in every comparison and failure', () => {
    const baseline = { color: 'rgba(41, 48, 66, 0.8)', 'font-weight': '600' };
    const wrong = { ...baseline, 'font-weight': '500' };
    const comparisons = [sample(baseline), sample(wrong, baseline), sample(wrong, baseline)];
    const report = createReport({ ...metadata, comparisons });
    const roundTrip = Json.parse(Json.stringify(report));
    expect(roundTrip).to.eql(report);
    expect(report.result).to.eql('FAIL');
    expect(report.comparisons).to.eql(comparisons);
    expect(report.failures).to.eql(comparisons.slice(1));
  });

  it('report capture → later input mutations cannot rewrite the evidence', () => {
    const actual = { color: 'red' };
    const baseline = { color: 'blue' };
    const comparison = sample(actual, baseline);
    const ruleFailure = { phase: 'isolated Light', descendantRules: 2 };
    const report = createReport({
      ...metadata,
      comparisons: [comparison],
      ruleFailures: [ruleFailure],
    });
    const captured = Json.stringify(report);
    actual.color = 'green';
    baseline.color = 'green';
    comparison.differences.length = 0;
    ruleFailure.descendantRules = 1;
    expect(Json.stringify(report)).to.eql(captured);
  });

  it('PASS / rule failure / partial ERROR → distinct outcomes and optional version metadata', () => {
    const comparisons = [sample({ color: 'blue' })];
    for (const browserVersion of ['', '   ']) {
      const report = createReport({ ...metadata, browserVersion, comparisons });
      expect(report.result).to.eql('PASS — computed styles; visual review still required');
      expect(report.browserVersion).to.eql(null);
      expect(report.failures).to.eql([]);
      expect(Json.parse(Json.stringify(report))).to.eql(report);
    }
    const failed = createReport({
      ...metadata,
      comparisons,
      browserVersion: '  160.0.1  ',
      ruleFailures: [{ phase: 'isolated Light', descendantRules: 2 }],
    });
    expect(failed.result).to.eql('FAIL');
    expect(failed.browserVersion).to.eql('160.0.1');
    expect(failed.failures).to.eql([{ phase: 'isolated Light', descendantRules: 2 }]);
    const error = createReport({ ...metadata, comparisons, error: 'Baseline unavailable' });
    expect(error.result).to.eql('ERROR');
    expect(error.error).to.eql('Baseline unavailable');
    expect(error.comparisons).to.eql(comparisons);
    expect(Json.parse(Json.stringify(error))).to.eql(error);
  });
});
