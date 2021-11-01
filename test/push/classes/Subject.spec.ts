import { expect, test } from '@jest/globals';
import { Push } from '@definitions';
import { Subject, configure, Observable } from '@push';
import { compliance } from '../../es-observable/compliance';

configure({ onUnhandledError: null });

class ObservableSubject<T> extends Observable<T> {
  public constructor(subscriber: Push.Subscriber<T>) {
    super(
      typeof subscriber === 'function'
        ? (obs) => {
            const subject = new Subject<T>();
            subject.subscribe(obs);
            return subscriber(subject);
          }
        : subscriber
    );
  }
}

test(`Subject passes compliance tests`, async () => {
  const response = await compliance({
    spec: false,
    name: 'Subject',
    logging: 'silent',
    Constructor: ObservableSubject
  });
  expect(response.result[1]).toHaveLength(0);
});
