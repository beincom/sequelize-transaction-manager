import { RuntimeException } from './exceptions';

export enum Propagation {
  /**
   * Support a current transaction, throw an exception if none exists.
   */
  MANDATORY = 'MANDATORY',

  /**
   *  Execute within a nested transaction if a current transaction exists, behave like REQUIRED otherwise.
   */
  NESTED = 'NESTED',

  /**
   * Execute non-transactional, throw an exception if a transaction exists.
   */
  NEVER = 'NEVER',

  /**
   * Execute non-transactional, suspend the current transaction if one exists.
   */
  NOT_SUPPORTED = 'NOT_SUPPORTED',

  /**
   * Support a current transaction, create a new one if none exists.
   */
  REQUIRED = 'REQUIRED',

  /**
   * Create a new transaction, and suspend the current transaction if one exists.
   */
  REQUIRES_NEW = 'REQUIRES_NEW',

  /**
   * Support a current transaction, execute non-transactional if none exists.
   */
  SUPPORTS = 'SUPPORTS',
}

export enum IsolationLevel {
  /**
   * One transaction can see the uncommitted changes made by the other transaction
   */
  READ_UNCOMMITTED = 'READ UNCOMMITTED',

  /**
   * Implements write locks until the transaction is completed but releases read locks when a SELECT operation is performed.
   */
  READ_COMMITTED = 'READ COMMITTED',

  /**
   * Implements read and write locks until the transaction is completed. Doesn't manage range locks.
   */
  REPEATABLE_READ = 'REPEATABLE READ',

  /**
   * Implements read and writes locks until the transaction is finished. Also implements range locks.
   */
  SERIALIZABLE = 'SERIALIZABLE',
}

export type TrxOptions = {
  propagation?: Propagation;
  isolation?: IsolationLevel;
  rollbackFor?: any[];
  noRollbackFor?: any[];
};

export type ClassTransactionOptions = TrxOptions;

export type MethodTransactionOptions = TrxOptions;

export type HookExceptions = RuntimeException | Error;

export type IAsyncFn = (...args: any[]) => Promise<any>;

export type IHookFunction = (...args: any[]) => void;

export type ExecuteFn = () => Promise<any>;

export type TransactionCreatedCallbackFn = (trx: ITransaction) => void;

export type SuspendTransactionFn = (willCommitBeforeSuspend?: boolean) => Promise<void>;

export type HookDefinition = {
  beforeCommit?: IHookFunction;
  afterCommit?: IHookFunction;
  afterRollback?: IHookFunction;
  afterComplete?: IHookFunction;
};

export type TransactionOpts = {
  autocommit?: boolean;
  isolation?: IsolationLevel;
  parent?: ITransaction | null;
};

export interface ITransaction {
  id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  finished: boolean;
}

export interface ITransactionManager {
  beginTransaction(
    execute: ExecuteFn,
    transactionCreatedCallback: TransactionCreatedCallbackFn,
    opts: {
      trxOptions?: TransactionOpts;
      hook?: HookDefinition;
      checkRollback?: (
        ex: Error,
        rollbackExceptions: ErrorConstructor[],
        ignoreExceptions: ErrorConstructor[],
      ) => boolean;
    },
  ): Promise<any>;
}
