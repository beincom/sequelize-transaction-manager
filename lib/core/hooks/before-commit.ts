import { TransactionPhase } from '../constants';
import { HookContext } from '../contexts/hook.context';

export const $BeforeCommit = (execute: () => void) => {
  const emitter = HookContext.getEmitterInContext();
  if (emitter) {
    emitter.once(TransactionPhase.BEFORE_COMMIT, execute);
  }
};
