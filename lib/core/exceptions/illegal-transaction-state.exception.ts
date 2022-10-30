import { TransactionException } from './transaction.exception';

export class IllegalTransactionStateException extends TransactionException {
  public constructor(msg: string, cause?: Error) {
    super(msg, cause);
  }
}
