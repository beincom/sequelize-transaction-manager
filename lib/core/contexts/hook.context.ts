import { AsyncContext } from './async-context';
import { ConstructorOptions, EventEmitter2 } from 'eventemitter2';
import { EMITTER_TOKEN, EVENT_HOOK, TransactionPhase } from '../constants';

export class HookContext extends AsyncContext {
  private static _emitterToken = EMITTER_TOKEN;

  public static set emitterToken(token: string) {
    this._emitterToken = token;
  }

  public static get emitterToken() {
    return this._emitterToken;
  }

  public static getEmitterInContext(): EventEmitter2 {
    return this.getNamespace().get(this._emitterToken);
  }

  public static setEmitterToContext(emitter: EventEmitter2) {
    return this.getNamespace().set(this.emitterToken, emitter);
  }

  public static createEmitter(options?: ConstructorOptions): EventEmitter2 {
    const emitter = new EventEmitter2(options);

    // use EventEmitter2 instead of  Nodejs EventEmitter
    // eslint-disable-next-line no-undef
    this.getNamespace().bindEmitter(emitter as unknown as NodeJS.EventEmitter);

    return emitter;
  }

  public static beforeCommit() {
    const emitter = this.getEmitterInContext();
    setImmediate(() => {
      emitter.emit(TransactionPhase.BEFORE_COMMIT);
      emitter.emit(EVENT_HOOK.END, undefined);
    });
  }

  public static afterCommit(result: any) {
    const emitter = this.getEmitterInContext();
    setImmediate(() => {
      emitter.emit(TransactionPhase.COMMITTED, result);
      emitter.emit(EVENT_HOOK.END, undefined);
    });
  }

  public static afterRollback(ex: any) {
    const emitter = this.getEmitterInContext();
    setImmediate(() => {
      emitter.emit(TransactionPhase.ROLLBACK, ex);
      emitter.emit(EVENT_HOOK.END, undefined);
    });
  }

  public static afterComplete() {
    const emitter = this.getEmitterInContext();
    setImmediate(() => {
      emitter.emit(EVENT_HOOK.COMPLETED, undefined);
      emitter.emit(EVENT_HOOK.END, undefined);
      emitter.removeAllListeners();
    });
  }

  public static process<R = any>(execute: () => Promise<R>) {
    const emitter = this.createEmitter({
      verboseMemoryLeak: true,
      maxListeners: 100,
    });
    return this._namespace.runAndReturn(() => {
      this.setEmitterToContext(emitter);
      return execute();
    });
  }
}
