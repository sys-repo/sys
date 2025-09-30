/**
 * RxJS ESM-only shim (typed bridge).
 *
 * Runtime values come from the pre-bundled artifact (`vendor/rx.esm.bundle.js`).
 * Types come from RxJS (type-only imports). We intentionally bypass structural
 * type checking with `as unknown as` so the bundle’s shapes don’t need to match
 * RxJS declaration details (construct signatures, statics, overloads).
 */

import type * as rx from 'rxjs';
import type * as ops from 'rxjs/operators';
import * as v from './vendor/rx.esm.bundle.js';

/** Core / creation / subjects */
export const animationFrameScheduler =
  v.animationFrameScheduler as unknown as typeof rx.animationFrameScheduler;

export const BehaviorSubject = v.BehaviorSubject as unknown as typeof rx.BehaviorSubject;

export const Observable = v.Observable as unknown as typeof rx.Observable;
export const Subject = v.Subject as unknown as typeof rx.Subject;
export const EMPTY = v.EMPTY as unknown as typeof rx.EMPTY;

export const firstValueFrom = v.firstValueFrom as unknown as typeof rx.firstValueFrom;
export const interval = v.interval as unknown as typeof rx.interval;
export const lastValueFrom = v.lastValueFrom as unknown as typeof rx.lastValueFrom;
export const observeOn = v.observeOn as unknown as typeof rx.observeOn;
export const of = v.of as unknown as typeof rx.of;
export const scan = v.scan as unknown as typeof rx.scan;
export const startWith = v.startWith as unknown as typeof rx.startWith;
export const timer = v.timer as unknown as typeof rx.timer;
export const merge = v.merge as unknown as typeof rx.merge;
export const combineLatest = v.combineLatest as unknown as typeof rx.combineLatest;
export const combineLatestWith = v.combineLatestWith as unknown as typeof rx.combineLatestWith;
export const shareReplay = v.shareReplay as unknown as typeof rx.shareReplay;

export const takeUntil = v.takeUntil as unknown as typeof rx.takeUntil;
export const defaultIfEmpty = v.defaultIfEmpty as unknown as typeof rx.defaultIfEmpty;

/** Pipeable operators */
export const auditTime = v.auditTime as unknown as typeof ops.auditTime;
export const catchError = v.catchError as unknown as typeof ops.catchError;
export const debounceTime = v.debounceTime as unknown as typeof ops.debounceTime;
export const delay = v.delay as unknown as typeof ops.delay;
export const filter = v.filter as unknown as typeof ops.filter;
export const map = v.map as unknown as typeof ops.map;
export const mergeWith = v.mergeWith as unknown as typeof ops.mergeWith;
export const take = v.take as unknown as typeof ops.take;
export const tap = v.tap as unknown as typeof ops.tap;
export const throttleTime = v.throttleTime as unknown as typeof ops.throttleTime;
export const timeout = v.timeout as unknown as typeof ops.timeout;
export const distinctUntilChanged =
  v.distinctUntilChanged as unknown as typeof ops.distinctUntilChanged;

/** Aliases */
export const distinctWhile = distinctUntilChanged;
