import { TransactionException } from './transaction.exception';

export class CannotRollbackTransactionException extends TransactionException {
  public constructor(msg: string, cause?: Error) {
    super(msg, cause);
  }
}
