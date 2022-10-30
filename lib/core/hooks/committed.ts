import { TransactionPhase } from '../constants';
import { HookContext } from '../contexts/hook.context';

export const $Committed = (execute: (result) => void) => {
  const emitter = HookContext.getEmitterInContext();
  if (emitter) {
    emitter.once(TransactionPhase.COMMITTED, execute);
  }
};
