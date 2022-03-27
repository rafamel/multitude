import { UnaryFn } from 'type-core';

export function push<I>(value: I): I;
export function push<I, O>(value: I, fo: UnaryFn<I, O>): O;
export function push<I, T1, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  fo: UnaryFn<T1, O>
): O;
export function push<I, T1, T2, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  fo: UnaryFn<T2, O>
): O;
export function push<I, T1, T2, T3, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  fo: UnaryFn<T3, O>
): O;
export function push<I, T1, T2, T3, T4, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  fo: UnaryFn<T4, O>
): O;
export function push<I, T1, T2, T3, T4, T5, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  f5: UnaryFn<T4, T5>,
  fo: UnaryFn<T5, O>
): O;
export function push<I, T1, T2, T3, T4, T5, T6, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  f5: UnaryFn<T4, T5>,
  f6: UnaryFn<T5, T6>,
  fo: UnaryFn<T6, O>
): O;
export function push<I, T1, T2, T3, T4, T5, T6, T7, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  f5: UnaryFn<T4, T5>,
  f6: UnaryFn<T5, T6>,
  f7: UnaryFn<T6, T7>,
  fo: UnaryFn<T7, O>
): O;
export function push<I, T1, T2, T3, T4, T5, T6, T7, T8, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  f5: UnaryFn<T4, T5>,
  f6: UnaryFn<T5, T6>,
  f7: UnaryFn<T6, T7>,
  f8: UnaryFn<T7, T8>,
  fo: UnaryFn<T8, O>
): O;
export function push<I, T1, T2, T3, T4, T5, T6, T7, T8, T9, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  f5: UnaryFn<T4, T5>,
  f6: UnaryFn<T5, T6>,
  f7: UnaryFn<T6, T7>,
  f8: UnaryFn<T7, T8>,
  f9: UnaryFn<T8, T9>,
  fo: UnaryFn<T9, O>
): O;
export function push<I, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  f5: UnaryFn<T4, T5>,
  f6: UnaryFn<T5, T6>,
  f7: UnaryFn<T6, T7>,
  f8: UnaryFn<T7, T8>,
  f9: UnaryFn<T8, T9>,
  f10: UnaryFn<T9, T10>,
  fo: UnaryFn<T10, O>
): O;
export function push<I, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  f5: UnaryFn<T4, T5>,
  f6: UnaryFn<T5, T6>,
  f7: UnaryFn<T6, T7>,
  f8: UnaryFn<T7, T8>,
  f9: UnaryFn<T8, T9>,
  f10: UnaryFn<T9, T10>,
  f11: UnaryFn<T10, T11>,
  fo: UnaryFn<T11, O>
): O;
export function push<I, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, O>(
  value: I,
  f1: UnaryFn<I, T1>,
  f2: UnaryFn<T1, T2>,
  f3: UnaryFn<T2, T3>,
  f4: UnaryFn<T3, T4>,
  f5: UnaryFn<T4, T5>,
  f6: UnaryFn<T5, T6>,
  f7: UnaryFn<T6, T7>,
  f8: UnaryFn<T7, T8>,
  f9: UnaryFn<T8, T9>,
  f10: UnaryFn<T9, T10>,
  f11: UnaryFn<T10, T11>,
  f12: UnaryFn<T11, T12>,
  fo: UnaryFn<T12, O>
): O;

export function push(
  this: any,
  value: any,
  ...fns: Array<UnaryFn<any, any>>
): any {
  if (!fns.length) return value;
  return fns.reduce((acc, fn) => fn.call(this, acc), value);
}
