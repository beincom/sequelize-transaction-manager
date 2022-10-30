import { Logger } from './loggers';
import { TransactionManager } from './transaction.manager';
import { HookContext, TransactionalContext } from './contexts';
import { IsolationLevel, ITransaction, Propagation, TrxOptions } from './types';

export const shouldRollback = (
  ex: Error,
  rollbackExceptions: ErrorConstructor[],
  ignoreExceptions: ErrorConstructor[],
): boolean => {
  const removeDuplicateExceptions = ignoreExceptions.filter(
    (ie) => !rollbackExceptions.includes(ie),
  );

  if (rollbackExceptions.some((re) => ex instanceof re)) {
    return true;
  }
  return !removeDuplicateExceptions.some((ie) => ex instanceof ie);
};

export function createProxyTransactionMethod<
  TransactionMethod extends (target: any, ...args: any[]) => ReturnType<TransactionMethod>,
>(originalMethod: TransactionMethod, options?: TrxOptions & { requestId?: string }) {
  function proxyMethod(target: any, ...args: any[]) {
    const propagation = options?.propagation ? options.propagation : Propagation.REQUIRED;

    const isolationLevel = options?.isolation ? options.isolation : IsolationLevel.READ_COMMITTED;

    const rollbackExceptions = options?.rollbackFor ? options.rollbackFor : [];

    const ignoreExceptions = options?.noRollbackFor ? options.noRollbackFor : [];

    const transactionManager = TransactionalContext.getTransactionManager<TransactionManager>();

    const currentTransaction = TransactionalContext.getTransaction<ITransaction>();

    const logger = Logger.createLogger(target.constructor.name);

    logger.enable(TransactionalContext.isEnableLog());

    transactionManager.setLogger(logger);

    const originalFn = async () => {
      return originalMethod.apply(target, args);
    };

    const prepareTransaction = () =>
      propagation === Propagation.REQUIRES_NEW
        ? null
        : (currentTransaction as unknown as ITransaction);

    const setTransaction = (trx) => TransactionalContext.setTransaction(trx);

    const proxyFn = async () => {
      return HookContext.process(() => {
        return transactionManager.beginTransaction(originalFn, setTransaction, {
          trxOptions: {
            isolation: isolationLevel,
            parent: prepareTransaction(),
          },
          hook: HookContext,
          checkRollback: (ex) => {
            return shouldRollback(ex, rollbackExceptions, ignoreExceptions);
          },
        });
      });
    };
    logger.log(
      `Call ${target.constructor.name}.${originalMethod.name}  with: [propagation: ${propagation}][isolationLevel: ${isolationLevel}]`,
    );
    return TransactionManager.processInTransaction({
      propagation,
      existedTransaction: currentTransaction,
      originalFn,
      proxyFn,
      suspendFn: TransactionalContext.suspendCurrentTransaction,
    });
  }

  return proxyMethod as TransactionMethod;
}
