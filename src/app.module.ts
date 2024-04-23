import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesModule } from './cases/cases.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '159.75.130.129',
      port: 3306,
      username: 'younglaw',
      password: '9156younglaw8270.',
      database: 'younglaw',
      entities: [],
      synchronize: true,
      autoLoadEntities: true,
    }),
    CasesModule,
    TeamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
@Module({
  imports: [UserModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
