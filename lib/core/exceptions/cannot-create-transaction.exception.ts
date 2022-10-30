import { TransactionException } from './transaction.exception';

export class CannotCreateTransactionException extends TransactionException {
  public constructor(msg: string, cause?: Error) {
    super(msg, cause);
  }
}
