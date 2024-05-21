import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesModule } from './cases/cases.module';
import { TeamModule } from './team/team.module';
import { ChatModule } from './chat/chat.module';
import { SessionModule } from './session/session.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';

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
    ScheduleModule.forRoot(),
    CasesModule,
    TeamModule,
    ChatModule,
    SessionModule,
    FileModule,
    ServeStaticModule.forRoot({
      rootPath: '/www/uploadFiles', // 绝对路径
      serveRoot: '/uploads',
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: '/Users/didi/downloads', // 绝对路径
    //   serveRoot: '/uploads',
    // }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
