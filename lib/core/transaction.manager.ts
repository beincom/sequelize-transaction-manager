import {
  ExecuteFn,
  HookDefinition,
  IAsyncFn,
  ITransaction,
  ITransactionManager,
  Propagation,
  SuspendTransactionFn,
  TransactionCreatedCallbackFn,
  TransactionOpts,
} from './types';
import {
  CannotCommitTransactionException,
  CannotCreateTransactionException,
  CannotRollbackTransactionException,
  IllegalTransactionStateException,
} from './exceptions';
import { ILogger } from './loggers';
import { Sequelize, Sequelize as Connection, Transaction } from 'sequelize';

export class TransactionManager implements ITransactionManager {
  private logger: ILogger;

  public setLogger(logger: ILogger) {
    this.logger = logger;
  }

  private static instance: TransactionManager;

  public static getInstance(conn: Connection): TransactionManager {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new TransactionManager(conn);
    return this.instance;
  }

  public constructor(private readonly conn: Connection) {}

  public async beginTransaction(
    execute: ExecuteFn,
    transactionCreatedCallback: TransactionCreatedCallbackFn,
    opts?: {
      trxOptions?: TransactionOpts;
      hook?: HookDefinition;
      checkRollback?: (ex: Error) => boolean;
    },
  ): Promise<any> {
    const trx = await TransactionManager.createTransaction(this.conn, opts?.trxOptions);
    transactionCreatedCallback(trx);
    try {
      this.logger.debug(`[tx-id: ${trx.id}] before commit tx`);
      if (opts?.hook?.beforeCommit) {
        opts.hook.beforeCommit();
      }
      const result = await execute();

      await TransactionManager.commit(trx);

      this.logger.debug(`[tx-id: ${trx.id}] after commit tx`);

      if (opts?.hook?.afterCommit) {
        opts.hook.afterCommit(result);
      }

      return result;
    } catch (ex) {
      if (opts?.checkRollback && !opts.checkRollback(ex)) {
        this.logger.warn(
          `[tx-id: ${trx.id}] Transaction did not rollback. check transactional rollback configuration.`,
        );

        throw ex;
      }
      await TransactionManager.rollback(trx);

      if (opts?.hook?.afterRollback) {
        opts.hook.afterRollback(ex);
      }
      throw ex;
    } finally {
      this.logger.debug(`[tx-id: ${trx.id}] after complete tx`);
      if (opts?.hook?.afterComplete) {
        opts.hook.afterComplete();
      }
    }
  }

  public static async createTransaction(
    connection: Sequelize,
    opts?: TransactionOpts,
  ): Promise<ITransaction> {
    try {
      return (await connection.transaction({
        autocommit: false,
        isolationLevel: opts?.isolation as unknown as Transaction.ISOLATION_LEVELS,
        transaction: opts?.parent as unknown as Transaction,
      })) as unknown as ITransaction;
    } catch (ex) {
      throw new CannotCreateTransactionException(`Cant not create transaction`, ex);
    }
  }

  public static async commit(trx: ITransaction) {
    try {
      if (!trx.finished) {
        await trx.commit();
      }
    } catch (ex) {
      throw new CannotCommitTransactionException(
        `[tx-id: ${trx.id}]: Cant not commit transaction`,
        ex,
      );
    }
  }

  public static async rollback(trx: ITransaction) {
    try {
      if (!trx.finished) {
        await trx.rollback();
      }
    } catch (ex) {
      throw new CannotRollbackTransactionException(
        `[tx-id: ${trx.id}]: Cant not rollback transaction`,
        ex,
      );
    }
  }

  public static async processInTransaction(args: {
    propagation: Propagation;
    existedTransaction: ITransaction;
    originalFn: IAsyncFn;
    proxyFn: IAsyncFn;
    suspendFn: SuspendTransactionFn;
  }) {
    const { propagation, existedTransaction, originalFn, proxyFn, suspendFn } = args;

    switch (propagation) {
      case Propagation.NEVER:
        if (existedTransaction) {
          throw new IllegalTransactionStateException(
            "Existing transaction found for transaction marked with propagation 'never'",
          );
        }
        return originalFn();
      case Propagation.MANDATORY:
        if (!existedTransaction) {
          throw new IllegalTransactionStateException(
            "No existing transaction found for transaction marked with propagation 'mandatory'",
          );
        }
        return originalFn();

      case Propagation.NESTED:
      case Propagation.REQUIRES_NEW:
        return proxyFn();

      case Propagation.NOT_SUPPORTED:
        if (existedTransaction) {
          await suspendFn(true);
          return originalFn();
        }
        return originalFn();

      case Propagation.REQUIRED:
        if (existedTransaction) {
          return originalFn();
        }
        return proxyFn();

      case Propagation.SUPPORTS:
        return originalFn();
    }
  }
}
