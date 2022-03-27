import { Serial } from 'type-core';

import { Push } from '@definitions';
import { filter } from './filter';

export function pick<T, U extends Serial.Primitive>(
  value: U
): Push.Operation<T, Extract<T, U>> {
  return filter((x: any) => x === value);
}
