import { SyncPromise } from 'promist';

import { Pull } from '@definitions';

export class Consume {
  public static process<T, U>(
    current: Pull.PullableIterator<T, U>,
    opposite: Pull.PullableIterator<U, T>,
    value: U
  ): Promise<void> {
    return SyncPromise.from(() => current.next(value)).operate(
      (result) => {
        return result.complete
          ? opposite.complete()
          : Consume.process(opposite, current, result.value);
      },
      (err) => {
        return SyncPromise.from(() => opposite.error(err as Error))
          .operate((result) => {
            return result.complete
              ? current.complete()
              : Consume.process(current, opposite, result.value);
          })
          .consume();
      }
    );
  }
}
