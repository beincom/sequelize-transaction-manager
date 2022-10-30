import { Sequelize } from 'sequelize';
import { TransactionManager } from '../core';
import { TransactionalContext } from '../core/contexts';

export const nextFn = (
  conn: Sequelize,
  next: (...args: any[]) => any,
  opts?: { enableLog: boolean },
) => {
  return TransactionalContext.getNamespace().runAndReturn(() => {
    const transactionManager = TransactionManager.getInstance(conn);
    TransactionalContext.setTransactionManager(transactionManager);
    if (opts?.enableLog || process?.env?.TRANSACTIONAL_CONTEXT_LOG === 'true') {
      TransactionalContext.enableLog();
    }
    return next();
  });
};
