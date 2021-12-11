import { MaybePromise } from 'type-core';

export declare namespace Pull {
  /* Constructor */
  export interface LikeConstructor {
    new <O, I = void>(provider: Provider<O, I>): Like<O, I>;
    prototype: Like<any, any>;
  }

  export interface PullableConstructor {
    new <O, I = void>(provider: Provider<O, I>): Pullable<O, I>;
    from<O, I = void>(item: Convertible<O, I>): Pullable<O, I>;
    prototype: Pullable<any, any>;
  }

  /* Pullable */
  export type Convertible<O = any, I = any> =
    | Like<O, I>
    | Compatible<O, I>
    | Iterable<O>;

  export interface Like<O = any, I = any> {
    source: Source<O, I>;
  }

  export interface Compatible<O = any, I = any> {
    [Symbol.asyncIterator](): AsyncIterator<O, void, I>;
  }

  export interface Pullable<O = any, I = any>
    extends Compatible<O, I>,
      Like<O, I> {
    consume(consumer: Consumer<O, I>): void;
  }

  /* Components */
  export type Provider<O, I> = () => Iterator<O, I | void>;
  export type Consumer<O, I> = () => Iterator<I, O>;

  export type Source<O, I> = () => PullableIterator<O, I | void>;
  export type Sink<O, I> = () => PullableIterator<I, O>;

  /* Iterators */
  export interface Iterator<O, I> {
    next?: (value: I) => MaybePromise<Response<O>>;
    error?: (reason: Error) => MaybePromise<Response<O>>;
    complete?: () => MaybePromise<void>;
  }

  export interface PullableIterator<O, I> extends Iterator<O, I> {
    next: (value: I) => MaybePromise<Response<O>>;
    error: (reason: Error) => MaybePromise<Response<O>>;
    complete: () => MaybePromise<void>;
  }

  /* Response */
  export type Response<T> =
    | { complete?: false; value: T }
    | { complete: true; value?: void };
}
