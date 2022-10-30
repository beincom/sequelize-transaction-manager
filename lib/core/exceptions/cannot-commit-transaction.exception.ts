import { TransactionException } from './transaction.exception';

export class CannotCommitTransactionException extends TransactionException {
  public constructor(msg: string, cause?: Error) {
    super(msg, cause);
  }
}
