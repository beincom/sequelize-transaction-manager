export class TransactionException extends Error {
  public cause?: Error;
  public constructor(msg: string, cause?: Error) {
    super(msg);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    this.cause = cause;
  }
}
