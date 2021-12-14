import { NullaryFn, TypeGuard } from 'type-core';
import { Pull } from '@definitions';

export class From {
  public static iteratorToPullable<O, I>(
    Constructor: Pull.PullableConstructor,
    executor: NullaryFn<Iterator<O, void, I>>
  ): Pull.Pullable<O, I> {
    return new Constructor(() => {
      const iterator = executor();
      return {
        next(value) {
          return From.resultToResponse(
            value === undefined ? iterator.next() : iterator.next(value)
          );
        },
        error(reason) {
          const method: any = iterator.throw;
          if (!TypeGuard.isUndefined(method)) {
            return From.resultToResponse(method.call(iterator, reason));
          } else {
            throw reason;
          }
        },
        complete() {
          const method: any = iterator.return;
          if (!TypeGuard.isUndefined(method)) {
            method.call(iterator);
          }
        }
      };
    });
  }
  public static asyncIteratorToPullable<O, I>(
    Constructor: Pull.PullableConstructor,
    executor: NullaryFn<AsyncIterator<O, void, I>>
  ): Pull.Pullable<O, I> {
    return new Constructor(() => {
      const iterator = executor();
      return {
        async next(value) {
          return From.resultToResponse(
            await (value === undefined ? iterator.next() : iterator.next(value))
          );
        },
        async error(reason) {
          const method: any = iterator.throw;
          if (!TypeGuard.isUndefined(method)) {
            return From.resultToResponse(await method.call(iterator, reason));
          } else {
            throw reason;
          }
        },
        async complete() {
          const method: any = iterator.return;
          if (!TypeGuard.isUndefined(method)) {
            await method.call(iterator);
          }
        }
      };
    });
  }
  public static pullableToAsyncIterator<O, I>(
    item: Pull.Like<O, I>
  ): AsyncIterator<O, void, I> {
    const source = item.source();
    return {
      async next(value: I) {
        return From.responseToResult(await source.next(value));
      },
      async throw(error) {
        return From.responseToResult(await source.error(error));
      },
      async return(): Promise<IteratorResult<O, void>> {
        await source.complete();
        return { done: true, value: undefined };
      }
    };
  }
  public static responseToResult<T>(
    item: Pull.Response<T>
  ): IteratorResult<T, void> {
    return item.complete
      ? { done: true, value: undefined }
      : { done: false, value: item.value };
  }
  public static resultToResponse<T>(
    item: IteratorResult<T, void>
  ): Pull.Response<T> {
    return item.done ? { complete: true } : { value: item.value };
  }
}
