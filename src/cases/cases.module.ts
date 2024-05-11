import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';
import { Team } from 'src/team/entities/team.entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    ChatModule,
    UserModule, // 导入用户模块
    TypeOrmModule.forFeature([Case, Team]),
  ],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
