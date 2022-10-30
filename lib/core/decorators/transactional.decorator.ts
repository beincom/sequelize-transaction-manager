import { randomUUID } from 'crypto';
import { createProxyTransactionMethod } from '../proxy';
import { ALL_METHOD, BLACKLIST_METHODS } from '../constants';
import { ClassTransactionOptions, MethodTransactionOptions, TrxOptions } from '../types';

const applyToAllMethod = (decorator: any, applyMethods: string | string[]) => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Function): void => {
    const methods = Object.getOwnPropertyNames(target.prototype).filter((method) =>
      BLACKLIST_METHODS.includes(method),
    );
    for (const methodName of methods) {
      if (applyMethods.includes(methodName) || applyMethods === ALL_METHOD) {
        let descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName);
        if (descriptor) {
          descriptor = decorator(target.prototype, methodName, descriptor);
          Object.defineProperty(target.prototype, methodName, descriptor);
        }
      }
    }
  };
};

const methodDecorator = (trxOptions: TrxOptions): MethodDecorator =>
  function <T>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value;
    const requestId = randomUUID();

    descriptor.value = async function (this: any, ...args: any[]) {
      return createProxyTransactionMethod(originalMethod, {
        ...trxOptions,
        requestId,
      })(this, ...args);
    };
    return descriptor as any;
  };

export function Transactional(trxOptions?: MethodTransactionOptions);
export function Transactional(methods: string | string[], trxOptions?: ClassTransactionOptions);
export function Transactional(...args: any[]) {
  if (typeof args[0] === 'string' || Array.isArray(args[0])) {
    return applyToAllMethod(methodDecorator(args[1]), args[0]);
  }
  return methodDecorator(args[0]);
}
