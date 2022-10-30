import { HookExceptions } from '../types';
import { TransactionPhase } from '../constants';
import { HookContext } from '../contexts/hook.context';

export const $Rollback = (execute: (error: HookExceptions) => void) => {
  const emitter = HookContext.getEmitterInContext();
  if (emitter) {
    emitter.once(TransactionPhase.ROLLBACK, execute);
  }
};
