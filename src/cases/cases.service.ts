import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EditCaseDto } from './dto/create-case.dto';
import { AuditCaseDto, CaseListDto } from './dto/update-case.dto';
import { Case } from './entities/case.entity';
import { CASE_STATUS } from './types';
import * as moment from 'moment';
import { USER_IDENTITY } from 'src/user/entities/user.entity';

@Injectable()
export class CasesService {
  @InjectRepository(Case) private caseRepository: Repository<Case>;

  async editCase(_editCaseDto: EditCaseDto, session) {
    if (_editCaseDto.id) {
      const caseById = this.caseRepository.findOne({
        where: { id: _editCaseDto.id },
      });
      if (!caseById) {
        this.noCaseError(_editCaseDto.id);
      }
      // 编辑
      this.caseRepository
        .createQueryBuilder()
        .update(Case)
        .set(_editCaseDto)
        .where('id=:id', { id: _editCaseDto.id })
        .execute();
    } else {
      // 新建
      const isCase = session.userInfo.identity.includes(USER_IDENTITY.PUBLIC);

      this.caseRepository.save({
        ..._editCaseDto,
        createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        username: session.nickName,
        avatarUrl: session.avatarUrl,
        status: CASE_STATUS.WAIT_FOR_AUDIT,
        type: isCase ? 1 : 0,
      });
    }
  }

  async detail(id: string) {
    const caseFinded = await this.caseRepository.findOne({
      where: { id: Number(id) },
    });

    if (!caseFinded) {
      this.noCaseError(id);
    }
    return caseFinded;
  }

  async audit({ id, auditComment, isPass }: AuditCaseDto, session) {
    console.log(session.userInfo);
    if (!session.userInfo.identity.includes(USER_IDENTITY.MANAGER)) {
      this.noAuth();
    }
    const caseById = await this.caseRepository.findOne({ where: { id } });
    if (!caseById) {
      this.noCaseError(id);
    }
    await this.caseRepository
      .createQueryBuilder()
      .update(Case)
      .set({
        auditComment,
        status: isPass
          ? CASE_STATUS.WAITTING
          : caseById.type
          ? CASE_STATUS.WAIT_FOR_AUDIT
          : CASE_STATUS.POST_AUDITED,
      })
      .where('id=:id', { id })
      .execute();
    return { success: true };
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

  noCaseError(id) {
    throw new HttpException(
      {
        errorno: 4,
        errormsg: `未找到id为${id}的帖子、案件`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  noAuth() {
    throw new HttpException(
      {
        errorno: 4,
        errormsg: `只有管理员可以审核`,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
