import { add, startOfDay, sub } from 'date-fns';
import { describe, expect, it, Testing } from '../-test.ts';
import { Time } from './mod.ts';

const FORMAT = 'yyyy-MM-dd hh:mm:ss';
const format = (date: Date) => Time.utc(date).format(FORMAT);

describe('timer', () => {
  it('starts with current date', async () => {
    await Testing.retry(3, async () => {
      const now = Time.now.format(FORMAT);
      const timer = Time.timer();
      expect(format(timer.startedAt)).to.eql(now);
    });
  });

  it('starts with given date', () => {
    const start = add(startOfDay(new Date()), { days: 1 });
    const timer = Time.timer(start);
    expect(format(timer.startedAt)).to.eql(format(start));
    expect(format(timer.startedAt)).to.not.eql(format(new Date()));
  });

  it('waits', async () => {
    const timer = Time.timer();
    expect(timer.elapsed.msec).to.lessThan(5); // NB: 'msecs' default unit for 'elapsed'.
    await Time.wait(10);
    expect(timer.elapsed.msec).to.greaterThan(6);
    expect(timer.elapsed.msec).to.greaterThan(6);
  });

  it('reports elapsed seconds', () => {
    const start = sub(new Date(), { minutes: 1, seconds: 30 });

    expect(Time.timer(start).elapsed.sec).to.eql(90);
    expect(Time.timer(start, { round: 0 }).elapsed.sec).to.eql(90);

    const timer = Time.timer(start);
    expect(timer.elapsed.toString('s')).to.eql('90s');
    expect(timer.elapsed.toString('sec')).to.eql('90s');
  });

  it('reports elapsed minutes', () => {
    const start = sub(new Date(), { minutes: 5, seconds: 24 });

    expect(Time.timer(start, { round: 0 }).elapsed.min).to.eql(5);
    expect(Time.timer(start, { round: 1 }).elapsed.min).to.eql(5.4);
    expect(Time.timer(start).elapsed.min).to.eql(5.4);

    const timer = Time.timer(start);
    expect(timer.elapsed.toString('m')).to.eql('5m');
    expect(timer.elapsed.toString('min')).to.eql('5m');
  });

  it('reports elapsed hours', () => {
    const start = sub(new Date(), { hours: 2, minutes: 37, seconds: 48 });

    expect(Time.timer(start).elapsed.hour).to.eql(2.6);
    expect(Time.timer(start, { round: 0 }).elapsed.hour).to.eql(3);
    expect(Time.timer(start, { round: 1 }).elapsed.hour).to.eql(2.6);
    expect(Time.timer(start, { round: 2 }).elapsed.hour).to.eql(2.63);

    const timer = Time.timer(start);
    expect(timer.elapsed.toString('h')).to.eql('3h');
    expect(timer.elapsed.toString('hour')).to.eql('3h');
  });

  it('reports elapsed days', () => {
    const start = sub(new Date(), { days: 4, hours: 18, minutes: 5 });

    const test = (round: undefined | number, ...expected: number[]) => {
      // NB: multiple round values → hack for variation between MacOS and Linux.
      const res =
        round === undefined
          ? Time.timer(start).elapsed.day
          : Time.timer(start, { round }).elapsed.day;
      const expectedMatch = expected.some((value) => res === value);
      expect(expectedMatch).to.eql(true);
    };

    test(undefined, 4.7, 4.8);
    test(1, 4.7, 4.8);
    test(0, 5);

    const timer = Time.timer(start);
    expect(timer.elapsed.toString('d')).to.eql('5d');
    expect(timer.elapsed.toString('day')).to.eql('5d');
  });

  it('toString()', () => {
    let start = new Date();
    const elapsed = () => Time.timer(start).elapsed;

    expect(elapsed().toString().endsWith('ms')).to.eql(true);

    start = sub(start, { seconds: 10 });
    expect(elapsed().toString()).to.eql('10s');

    start = sub(start, { seconds: 25 });
    expect(elapsed().toString()).to.eql('35s');

    start = sub(start, { seconds: 24 });
    expect(elapsed().toString()).to.eql('59s');

    start = sub(start, { minutes: 1 });
    expect(elapsed().toString()).to.eql('2m');

    start = sub(start, { minutes: 14.5 });
    expect(elapsed().toString()).to.eql('16m');

    start = sub(start, { minutes: 43 });
    expect(elapsed().toString()).to.eql('59m');

    start = sub(start, { minutes: 1.1 });
    expect(elapsed().toString()).to.eql('1h');

    start = sub(start, { minutes: 29 });
    expect(elapsed().toString()).to.eql('1h');

    start = sub(start, { minutes: 1 });
    expect(elapsed().toString()).to.eql('2h');

    start = sub(start, { hours: 1 });
    expect(elapsed().toString()).to.eql('3h');

    start = sub(start, { hours: 24 });
    expect(elapsed().toString()).to.eql('1d');

    start = sub(start, { hours: 24 });
    expect(elapsed().toString()).to.eql('2d');

    start = sub(start, { hours: 48 });
    expect(elapsed().toString()).to.eql('4d');
  });
});
