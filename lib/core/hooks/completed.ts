import { EVENT_HOOK } from '../constants';
import { HookContext } from '../contexts/hook.context';

export const $Completed = (execute: () => void) => {
  const emitter = HookContext.getEmitterInContext();
  if (emitter) {
    emitter.once(EVENT_HOOK.COMPLETED, execute);
  }
};
