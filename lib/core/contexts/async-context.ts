import { createNamespace, Namespace } from 'cls-hooked';
import { RuntimeException } from '../exceptions';
import { NAMESPACE_CLS_HOOK } from '../constants';

export class AsyncContext {
  protected static _namespace: Namespace;
  protected static _namespaceToken: string = NAMESPACE_CLS_HOOK;

  public static init() {
    if (!this._namespace) {
      this._namespace = createNamespace(this._namespaceToken);
    }
  }

  public static getNamespace(): Namespace {
    if (!this._namespace) {
      throw new RuntimeException(`Transactional context is not initialized`);
    }
    return this._namespace;
  }

  public static setNamespaceToken(value: string) {
    this._namespaceToken = value;
  }

  public static setNamespace(ns: Namespace) {
    this._namespace = ns;
  }
}
