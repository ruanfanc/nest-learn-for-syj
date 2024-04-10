import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { SubmitCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { Case } from './entities/case.entity';
import { CASE_STATUS } from './types';

@Injectable()
export class CasesService {
  @InjectRepository(Case) private caseRepository: Repository<Case>
  private readonly userService: UserService // inject user service

  async submit(submitCaseDto: SubmitCaseDto, session) {
    // ========================= edit ==========================
    if(submitCaseDto.id) {
      const caseFinded = await this.caseRepository.find({ where: { id: submitCaseDto.id } })

      if (caseFinded) {
        await this.caseRepository
        .createQueryBuilder()
        .update(Case).set(submitCaseDto).where('id=:id', { id: submitCaseDto.id }).execute()

        return {
          success: true
        }
      }

      throw new HttpException({
        errorno: 2,
        errormsg: `未找到id为${submitCaseDto.id}的帖子、案件`,
      }, HttpStatus.BAD_REQUEST);
    }

    
    const [userInfo] = await this.userService.getUserInfo(session.openid)

    if (!userInfo) {
      throw new HttpException({
        errorno: 3,
        errormsg: `未找到openid为${session.openid}的用户`,
      }, HttpStatus.BAD_REQUEST);
    }

    // =========================== create ====================
    if(submitCaseDto.isSubmit) {
      const caseInfo = await this.caseRepository.save({ 
        ...submitCaseDto,
        avatarUrl: userInfo.avatarUrl,
        username: userInfo.nickName,
        userdesc: userInfo.groupId || '',
        status: CASE_STATUS.WAIT_FOR_AUDIT,
      })

      return {
        id: caseInfo.id,
        success: true
      }
    } else {
      // =========================== draft ========================
      const caseInfo = await this.caseRepository.save({ 
        ...submitCaseDto,
        avatarUrl: userInfo.avatarUrl,
        username: userInfo.nickName,
        userdesc: userInfo.groupId || '',
        status: CASE_STATUS.DRAFT,
      })

      return {
        id: caseInfo.id,
        success: true
      }
    }
  }

  findAll() {
    return `This action returns all cases`;
  }

  findOne(id: number) {
    return `This action returns a #${id} case`;
  }

  update(id: number, updateCaseDto: UpdateCaseDto) {
    return `This action updates a #${id} case`;
  }

  remove(id: number) {
    return `This action removes a #${id} case`;
  }
}
