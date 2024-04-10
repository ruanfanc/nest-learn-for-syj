import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';

@Module({
  imports: [
    UserModule, // 导入用户模块
    TypeOrmModule.forFeature([Case])
  ],
  controllers: [CasesController],
  providers: [CasesService]
})
export class CasesModule {}
