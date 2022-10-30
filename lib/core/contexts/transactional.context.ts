import { randomUUID } from 'crypto';
import { ITransaction } from '../types';
import { AsyncContext } from './async-context';
import { TransactionManager } from '../transaction.manager';
import { LOGGER_TOKEN, REQUEST_ID_TOKEN, TRANSACTION_TOKEN, TRX_MANAGER_TOKEN } from '../constants';

export class TransactionalContext extends AsyncContext {
  public static enableLog() {
    this.getNamespace().set(LOGGER_TOKEN, true);
  }

  public static isEnableLog() {
    return this.getNamespace().get(LOGGER_TOKEN);
  }

  public static getRequestId() {
    return this.getNamespace().get(REQUEST_ID_TOKEN);
  }

  public static generateRequestId = () => {
    this.getNamespace().set(REQUEST_ID_TOKEN, randomUUID());
  };

  public static setTransactionManager(trxManager: any) {
    this.getNamespace().set(TRX_MANAGER_TOKEN, trxManager);
  }

  public static getTransactionManager<T>(): T {
    return this.getNamespace().get(TRX_MANAGER_TOKEN) as unknown as T;
  }

  public static getTransaction<T>(): T {
    return this.getNamespace().get(TRANSACTION_TOKEN) as unknown as T;
  }

  public static async suspendCurrentTransaction(commit?: boolean) {
    const tx = this.getNamespace().get(TRANSACTION_TOKEN) as unknown as ITransaction;
    if (tx && commit) {
      await TransactionManager.commit(tx);
    }
    this.getNamespace().set(TRANSACTION_TOKEN, null);
  }

  public static setTransaction(trx: unknown) {
    this.getNamespace().set(TRANSACTION_TOKEN, trx);
  }
}
