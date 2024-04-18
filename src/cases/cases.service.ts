import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { EditCaseDto, SubmitCaseDto } from './dto/create-case.dto';
import { AuditCaseDto, CaseListDto } from './dto/update-case.dto';
import { Case } from './entities/case.entity';
import { CASE_STATUS } from './types';
import moment from 'moment';
import { USER_IDENTITY } from 'src/user/entities/user.entity';

@Injectable()
export class CasesService {
  @InjectRepository(Case) private caseRepository: Repository<Case>;
  private readonly userService: UserService; // inject user service
  async editCase(_editCaseDto: EditCaseDto, session) {
    if (_editCaseDto.id) {
      // 编辑
    } else {
      // 新建

      const isCase = session.identity.includes(USER_IDENTITY.PUBLIC);

      this.caseRepository.save({
        ..._editCaseDto,
        createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        username: session.user,
        avatarUrl: session.avatarUrl,
        status: isCase ? CASE_STATUS.WAIT_FOR_AUDIT : CASE_STATUS.NOCASE,
        type: isCase ? 1 : 0,
      });
    }
  }

  async submit(submitCaseDto: SubmitCaseDto, session) {
    // ========================= edit ==========================
    if (submitCaseDto.id) {
      const caseFinded = await this.caseRepository.find({
        where: { id: submitCaseDto.id },
      });

      if (caseFinded) {
        await this.caseRepository
          .createQueryBuilder()
          .update(Case)
          .set(submitCaseDto)
          .where('id=:id', { id: submitCaseDto.id })
          .execute();

        return {
          success: true,
        };
      }

      throw new HttpException(
        {
          errorno: 2,
          errormsg: `未找到id为${submitCaseDto.id}的帖子、案件`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const [userInfo] = await this.userService.getUserInfo(session.openid);

    if (!userInfo) {
      throw new HttpException(
        {
          errorno: 3,
          errormsg: `未找到openid为${session.openid}的用户`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // =========================== create ====================
    if (submitCaseDto.isSubmit) {
      const caseInfo = await this.caseRepository.save({
        ...submitCaseDto,
        avatarUrl: userInfo.avatarUrl,
        username: userInfo.nickName,
        userdesc: userInfo.groupId || '',
        status: CASE_STATUS.WAIT_FOR_AUDIT,
      });

      return {
        id: caseInfo.id,
        success: true,
      };
    } else {
      // =========================== draft ========================
      const caseInfo = await this.caseRepository.save({
        ...submitCaseDto,
        avatarUrl: userInfo.avatarUrl,
        username: userInfo.nickName,
        userdesc: userInfo.groupId || '',
        status: CASE_STATUS.DRAFT,
      });

      return {
        id: caseInfo.id,
        success: true,
      };
    }
  }

  async detail(id: string) {
    const caseFinded = await this.caseRepository.find({
      where: { id: Number(id) },
    });

    if (caseFinded) {
      return caseFinded[0];
    }

    throw new HttpException(
      {
        errorno: 4,
        errormsg: `未找到id为${id}的帖子、案件`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  async audit({ id, auditComment, isPass }: AuditCaseDto) {
    const caseFinded = await this.caseRepository
      .createQueryBuilder()
      .update(Case)
      .set({
        auditComment,
        status: isPass ? CASE_STATUS.WAITTING : CASE_STATUS.WAIT_FOR_AUDIT,
      })
      .where('id=:id', { id })
      .execute();

    if (caseFinded) {
      return {
        success: true,
      };
    }

    throw new HttpException(
      {
        errorno: 5,
        errormsg: `审核失败，可能未找到该案件`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  async findAll({ pageNo, pageSize }: CaseListDto) {
    const skip = (pageNo - 1) * pageSize;
    const [data, total] = await this.caseRepository.findAndCount({
      take: pageSize,
      skip: skip,
    });

    return {
      cases: data,
      total,
    };
  }
}
