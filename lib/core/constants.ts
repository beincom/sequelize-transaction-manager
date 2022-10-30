export enum TransactionPhase {
  BEFORE_COMMIT = 'before_commit',
  COMMITTED = 'commit',
  ROLLBACK = 'rollback',
}

export const EVENT_HOOK = {
  COMPLETED: 'complete',
  END: 'end',
};

export const ALL_METHOD = '*';

export const BLACKLIST_METHODS = [
  'constructor',
  'toString',
  'toLocaleString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
];

export const NAMESPACE_CLS_HOOK = 'namespace.cls_hook';

export const REQUEST_ID_TOKEN = 'request_id_token.cls_hook';

export const TRANSACTION_TOKEN = 'transaction';

export const EMITTER_TOKEN = 'emitter_token.cls_hook';

export const TRX_MANAGER_TOKEN = 'trx_manager_token.cls_hook';

export const LOGGER_TOKEN = 'logger.cls_hook';
