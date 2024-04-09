import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UserModule, // 导入用户模块
  ],
  controllers: [CasesController],
  providers: [CasesService]
})
export class CasesModule {}
