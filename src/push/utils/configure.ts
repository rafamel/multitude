import { Push } from '@definitions';
import { Globals } from '@helpers';

export type ConfigureOptions = Push.Hooks;

export function configure(options: ConfigureOptions | null): void {
  Globals.setGlobals(options);
}
