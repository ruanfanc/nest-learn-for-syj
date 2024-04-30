import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EditCaseDto } from './dto/create-case.dto';
import { AuditCaseDto, CaseListDto } from './dto/update-case.dto';
import { Case } from './entities/case.entity';
import { CASES_BUTTONS_MAP_Value, CASE_STATUS } from './types';
import { User, USER_IDENTITY } from 'src/user/entities/user.entity';
import { Team } from 'src/team/entities/team.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class CasesService {
  @InjectRepository(Case) private caseRepository: Repository<Case>;
  @InjectRepository(Team) private teamRepository: Repository<Team>;

  async editCase(_editCaseDto: EditCaseDto, session) {
    if (_editCaseDto.id) {
      const caseById = this.caseRepository.findOne({
        where: { id: _editCaseDto.id },
      });
      if (!caseById) {
        this.noCaseError(_editCaseDto.id);
      }
      // 编辑
      await this.caseRepository
        .createQueryBuilder()
        .update(Case)
        .set(_editCaseDto)
        .where('id=:id', { id: _editCaseDto.id })
        .execute();
    } else {
      // 新建
      const isCase = session.userInfo.identity.includes(USER_IDENTITY.PUBLIC);

      await this.caseRepository.save({
        ..._editCaseDto,
        userId: session.openid,
        avatarUrl: session.avatarUrl,
        status: CASE_STATUS.WAIT_FOR_AUDIT,
        type: isCase ? 2 : 1,
      });
    }

    return { success: true };
  }

  async detail(id: string, session: { userInfo: User }) {
    const caseFinded = await this.caseRepository.findOne({
      where: { id: Number(id) },
    });
    console.log('session: ', session);
    if (!caseFinded) {
      this.noCaseError(id);
    }
    const getButtons = async () => {
      const buttons: CASES_BUTTONS_MAP_Value = [];

      if (caseFinded.userId === session.userInfo.id) {
        buttons.push(1);
        buttons.push(5);
        // ============= 重新委托团队 ==================
        if (caseFinded.status === CASE_STATUS.PROCESSING) {
          buttons.push(3);
        }
      } else {
        // ============== 详谈 ===================
        buttons.push(2);

        // ======================= 放弃受理 ===========================
        const team = await this.teamRepository.findOne({
          where: { id: session.userInfo.groupId },
          select: ['admins'],
        });

        const isTeamAdmin = !!team?.admins?.includes(session.userInfo.id);

        if (session.userInfo.groupId === caseFinded.relateGroup) {
          if (isTeamAdmin) {
            buttons.push(4);
          }
        }
        if (caseFinded.status === CASE_STATUS.WAITTING) {
          buttons.push(6);
        }
        if (
          caseFinded.status === CASE_STATUS.WAIT_FOR_AUDIT &&
          session.userInfo.identity.includes(USER_IDENTITY.MANAGER)
        ) {
          buttons.push(7);
        }
      }
      return buttons;
    };

    return {
      detail: {
        ...caseFinded,
        buttons: await getButtons(),
      },
    };
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

  async findAll({
    pageNo,
    pageSize,
    userId,
    status,
    groupId,
    startTime,
    endTime,
    orderByTime = true,
  }: CaseListDto) {
    const skip = (pageNo - 1) * pageSize;
    let query = this.caseRepository.createQueryBuilder('case');
    if (userId) query = query.where('case.userId = :userId', { userId });

    if (status && status.length)
      query = query.andWhere('case.status IN (:...status)', { status });

    if (groupId)
      query = query.where('case.relateGroup = :groupId', { groupId });

    if (startTime && endTime)
      query = query.where('case.createTime BETWEEN :start AND :end', {
        start: startTime,
        end: endTime,
      });

    const [data, total] = await query
      .orderBy('case.createTime', orderByTime ? 'DESC' : 'ASC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      cases: data.map((item) => ({
        ...item,
        createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
      })),
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
