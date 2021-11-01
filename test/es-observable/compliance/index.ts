import { Push } from '@definitions';
import { engine, Logging, Response } from './engine';
import { tests } from './tests';

export interface ComplianceOptions {
  spec: boolean;
  name: string;
  logging: Logging;
  Constructor: Push.ObservableConstructor;
}

export function compliance(options: ComplianceOptions): Promise<Response> {
  return engine(
    options.name,
    tests(options.Constructor, options.spec),
    options.logging
  );
}
