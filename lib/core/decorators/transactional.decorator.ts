import { randomUUID } from 'crypto';
import { ALL_METHOD } from '../constants';
import { createProxyTransactionMethod } from '../proxy';
import { ClassTransactionOptions, MethodTransactionOptions, TrxOptions } from '../types';

export const  cloneMetadata = (source: any, target: any) => {
  const keys = Reflect.getMetadataKeys(source);
  keys.forEach((key) => {
    const value = Reflect.getMetadata(key, source);
    Reflect.defineMetadata(key, value, target);
  });
}

export const methodDecorator = (trxOptions: TrxOptions) =>
   (target: any, methodName: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const originalMethod = descriptor.value;
    const requestId = randomUUID();
    descriptor.value = async function (...args: any[]) {
      return createProxyTransactionMethod(originalMethod, {
        ...trxOptions,
        requestId,
      })(this, ...args);
    };
    return descriptor;
  };

export const applyToAllMethod = (decorator: any, applyMethods: string | string[]) => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return <T extends Function>(target: T): void => {
    const propertyDescriptors = Object.getOwnPropertyDescriptors(target.prototype);

    for (const [propName, descriptor] of Object.entries(propertyDescriptors)) {

      const isMethod = propName != 'constructor' && typeof descriptor.value == 'function';
      const isApplyAllMethod = applyMethods === ALL_METHOD;

      if (!isMethod) continue;
      if (!isApplyAllMethod && !applyMethods.includes(propName)) continue;

      const originalMethod = descriptor.value;

      decorator(target, propName, descriptor);

      if (originalMethod != descriptor.value) {
        cloneMetadata(originalMethod, descriptor.value);
      }
      Object.defineProperty(target.prototype, propName, descriptor);
    }
  }
};


// eslint-disable-next-line @typescript-eslint/ban-types
export function Transactional(trxOptions?: MethodTransactionOptions): MethodDecorator;
export function Transactional(methods: string | string[], trxOptions?: ClassTransactionOptions): ClassDecorator;
export function Transactional(...args: any[]): ClassDecorator | MethodDecorator {
  if (typeof args[0] === 'string' || Array.isArray(args[0])) {
    return applyToAllMethod(methodDecorator(args[1]), args[0]);
  }
  return methodDecorator(args[0]);
}
