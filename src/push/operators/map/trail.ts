import { TypeGuard } from 'type-core';
import { Push } from '@definitions';
import { operate } from '../../utils/operate';

/**
 * @param count default: 2
 */
export function trail<T>(count?: number): Push.Operation<T, T[]> {
  const number = TypeGuard.isEmpty(count) ? 2 : count;

  return operate<T, T[]>((obs) => {
    const arr: T[] = [];
    return {
      next(value: T): void {
        arr.push(value);
        if (arr.length > number) arr.shift();
        if (arr.length === number) {
          obs.next(Array.from(arr));
        }
      }
    };
  });
}
