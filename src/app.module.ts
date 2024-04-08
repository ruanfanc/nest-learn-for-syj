import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesModule } from './cases/cases.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'younglaw',
      entities: [],
      synchronize: true,
      autoLoadEntities: true
    }),
    CasesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
@Module({
  imports: [UserModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
