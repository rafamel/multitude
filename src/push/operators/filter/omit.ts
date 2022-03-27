import { Serial } from 'type-core';

import { Push } from '@definitions';
import { filter } from './filter';

export function omit<T, U extends Serial.Primitive>(
  value: U
): Push.Operation<T, Exclude<T, U>> {
  return filter((x: any) => x !== value);
}
