import {DataTypes, Model, Sequelize} from 'sequelize';
import {Logger} from '../lib/core/loggers';
import {initTransactionalContext} from '../lib/core/init';
import {RuntimeException} from '../lib/core/exceptions';
import {IsolationLevel, nextFn, Propagation, Transactional} from '../lib';
import {randomUUID} from 'crypto';
import {$BeforeCommit, $Committed} from '../lib/core/hooks';

initTransactionalContext();

export class Database {
  private static conn: Sequelize;

  public static getInstance() {
    if (!this.conn) {
      this.conn = new Sequelize({
        dialect: 'postgres',
        host: '127.0.0.1',
        port: 5432,
        username: 'root',
        password: 'root',
        database: 'test',
        // eslint-disable-next-line no-console
        logging: (...args) => {
          const log = new Logger(Database.name);
          log.enable(true);
          log.debug(args[0]);
        },
      });
    }
    return this.conn;
  }
}

const UserModel = Database.getInstance().define<
  Model<
    {
      id: string;
      name: string;
    },
    {
      id: string;
      name: string;
    }
  >
>(
  'UserModel',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'users',
    timestamps: false,
  },
);

@Transactional('*',{
  propagation: Propagation.MANDATORY,
  isolation: IsolationLevel.SERIALIZABLE,
  noRollbackFor: [RuntimeException],
})
export class CreateUserService {
  public async create() {
    const id = randomUUID();

    $BeforeCommit(() => {
      console.log('trx start 1', {
        id,
        name: 'the van 1',
      });
    });

    await UserModel.create({
      id,
      name: 'the van 1',
    });
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const ud = new UpdateUserService();
    return ud.update();
  }
}

@Transactional(['update'],{
  noRollbackFor: [RuntimeException],
})
export class UpdateUserService {
  public async update() {
    const user2 = await UserModel.create({
      id: randomUUID(),
      name: 'the van 2',
    });

    $Committed((data) => {
      console.log('done trx 2');
    });

    return user2;
  }
}

(async () => {
  await nextFn(
    Database.getInstance(),
    async () => {
      const createUserService = new CreateUserService();
      createUserService.create().then((result) => {});
    },
    {
      enableLog: true,
    },
  );
})();
