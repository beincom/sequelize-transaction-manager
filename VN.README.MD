## Package này để làm gì.

- Thay vì việc phải khởi tạo thủ công transaction như sau:

```ts
// Unmanaged transactions
const t = await sequelize.transaction();
try {
    const user = await User.create({
        firstName: 'Abraham',
        lastName: 'Lincoln'
    }, { transaction: t });
    
    await t.commit();
} catch (error) {
    await t.rollback();
}

// Managed transactions
await sequelize.transaction(async t => {
    const user = await User.create({
        firstName: 'Abraham',
        lastName: 'Lincoln'
    }, { transaction: t });
});
```

- Chúng ta sẽ sử dụng **Transactional Decorator**.

```ts
import { Transactional } from "@beincom/sequelize-transaction-manager";

export class UserService {

    @Transactional()
    public async create() {
       return User.create({
            firstName: 'Abraham',
            lastName: 'Lincoln'
        }, { transaction: t });
    }
}
```
> Ngoài ra package này cũng support việc handler transaction sao cho phù hợp với business của ứng dụng.

## Cài đặt

```bash
$ npm install --save @beincom/sequelize-transaction-manager 
# OR
$ yarn add @beincom/sequelize-transaction-manager
```


## Thiết lập
- Options của @Transactional
```ts
export type TrxOptions = {
  propagation?: Propagation;
  isolation?: IsolationLevel;
  rollbackFor?: any[];
  noRollbackFor?: any[];
};

```

### Transaction Propagation.
> Sự lan truyền transaction. Tương tự như Spring TX. Package cung cấp 7 options cho Propagation trong **@Transactional**

- **REQUIRED**(Mặc định): Nếu có một transaction đang hoạt động thì sẽ sử dụng lại, nếu không có transaction nào đang hoạt động sẽ tạo một transaction mới cho method được gọi.
- **MANDATORY**: Phải có một transaction đang hoạt động trước khi gọi method, nếu không throw exception.
- **NESTED**: Tạo một transaction mới nếu không có transaction nào đang hoạt động. Nếu có transaction đang hoạt động tạo một savepoint và rollback tại đây nếu có Exception xảy ra.
- **NEVER**: Thực hiện method mà không có transaction, nếu có throw exception.
- **NOT_SUPPORTED**:  Nếu có một transaction đang hoạt động thì nó sẽ bị dừng lại. Thực hiện method mà không có transaction.
- **REQUIRES_NEW**: Luôn bắt đầu một transaction mới cho method được gọi. Nếu method được gọi với một transaction đang hoạt động, transaction đó sẽ bị tạm ngưng, một transaction mới sẽ được tạo và sử dụng cho method này.Transaction mới vừa được tạo sẽ thực thi độc lập với transaction bên ngoài, khi transaction này kết thúc dữ liệu sẽ được đồng bộ xuống database
- **SUPPORTS**: Nếu có một transaction đang hoạt động thì sẽ sử dụng lại, còn không thực hiện method mà không có transaction.

### Isolation Levels.
> Sự cô lập transaction.

- **READ_UNCOMMITTED**(PostgreSQL không hỗ trợ): Transaction có thể đọc những data mới nhất, không quan tâm đến việc data đó được commit hay chưa.
- **READ_COMMITTED**: Transaction sẽ không thấy data/không thể update data đang được modify ở transaction khác mà chưa commit.
- **REPEATABLE_READ**: Trong cùng một transaction, đảm bảo dữ liệu chắc chắc là thống nhất trong tất cả các lần query, không quan tâm đến việc các transaction khác đã commit sự thay đổi hay chưa.
- **SERIALIZABLE**: Tuần tự nối tiếp cho tất cả các transaction, gẫn như không có transaction nào diễn ra đồng thời.


### Rollback handling.
> Sẽ hơi khác hành vi của Spring TX mặc định chỉ rollback khi throw RuntimeException. Với package này thì mặc định là rollback tất cả error được throw nếu không chỉ định cụ thể :D.

- **rollbackFor** và **noRollbackFor**: Chỉ ra exception nào sẽ rollback transaction và exception nào thì không.

### Transaction phase.
> Giai đoạn của transaction. Trigger hook tương ứng.

- **BEFORE_COMMIT**: Trước khi transaction commit.
- **COMMITTED**: Sau khi transaction commit.
- **ROLLBACK**: Sau khi transaction rollback.
### Hook.
> Cung cấp hook để thêm code vào lifecycle của transaction.
- **$BeforeCommit**: Thực thi trước khi commit transaction.
```ts
export class UserService {

    @Transactional()
    public async create(createUserDto: CreateUserDto) {
        $BeforeCommit(() => {
           this.logger.log('before commit', createUserDto);
           // fire event,...etc.
        })
        return User.create();
    }
}

```
> <i><span style="color:red">$BeforeCommit phải được đăng kí ở trên khối lệnh query vào db, callback của nó không được đợi kết quả từ promise, nếu không nó sẽ bị bỏ qua.</span>.</i>

- **$Committed**: Thực thi callback với result của method làm arg.

```ts
export class UserService {

    @Transactional()
    public async create(createUserDto: CreateUserDto) {
        
        const user = await User.create();


        $Committed((user: User) => {
            this.logger.log('after commit', user);
            // fire event,...etc.
        });
        return user;
    }
}

```

- **$Rollback**:  Thực thi callback với exception làm arg.

```ts

export class UserService {

    @Transactional()
    public async create(createUserDto: CreateUserDto) {

        const user = await User.create();
        $Rollback((ex) => {
            this.logger.log('after rollback', ex);
            // fire event,...etc.
        });
        return user;
    }
}

```
- **$Completed**: Thực thi sau khi method hoàn thành.

```ts

export class UserService {

    @Transactional()
    public async create(createUserDto: CreateUserDto) {

        const user = await User.create();
        $Completed(() => {
            this.logger.log('after compelte', ex);
            // fire event,...etc.
        });
        return user;
    }
}

```

### Logging
- Enabale khi gọi **nextFn** xem phần [Tích hợp](#/th)
- Thêm evn **TRANSACTIONAL_CONTEXT_LOG=true**

## <a href="#/th">Tích hợp</a>

### Nestjs.
- Gọi initTransactionalContext trước khi application được khởi tạo.
```ts
import { initTransactionalContext } from '@beincom/sequelize-transaction-manager'

function async bootstrap() {
    initTransactionalContext();
    // init applicaton
}

```
- TransactionManagerMiddleware.

```ts
import { nextFn } from '@beincom/sequelize-transaction-manager'

@Injectable()
export class  TransactionManagerMiddleware implements NestMiddleware {
    public constructor(@InjectConnection() connection: Sequelize) {
    }

    public use(req: Request, res: Response, next: NextFunction) {
        return  nextFn(
            connection,
            next,
            {
                enableLog: true,
            },
        );
    }
}

```
- Tại AppModule.
```ts
@Module({
  imports: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TransactionManagerMiddleware)
      .forRoutes('*');
  }
}
```

