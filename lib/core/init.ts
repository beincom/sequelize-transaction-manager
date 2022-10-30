import { Sequelize } from 'sequelize';
import { TransactionalContext, HookContext } from './contexts';

export function initTransactionalContext() {
  TransactionalContext.init();
  const namespace = TransactionalContext.getNamespace();
  HookContext.setNamespace(namespace);
  Sequelize.useCLS(namespace);
}
