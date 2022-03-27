import { NullaryFn } from 'type-core';

import { Push } from '@definitions';
import { operate } from '../../utils/operate';

export function debounce<T>(due: number): Push.Operation<T> {
  return operate<T>((obs) => {
    let timeout: void | NodeJS.Timeout;
    let push: void | NullaryFn;

    return {
      next(value) {
        if (timeout) clearTimeout(timeout);

        push = () => {
          push = undefined;
          obs.next(value);
        };

        timeout = setTimeout(() => (push ? push() : null), due);
      },
      complete() {
        if (timeout) clearTimeout(timeout);
        if (push) push();
        obs.complete();
      },
      teardown() {
        if (timeout) clearTimeout(timeout);
      }
    };
  });
}
