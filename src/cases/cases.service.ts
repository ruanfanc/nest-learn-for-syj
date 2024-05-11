import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EditCaseDto } from './dto/create-case.dto';
import {
  AuditCaseDto,
  CaseListDto,
  AgreeHandlepCaseDto,
  ReEntrustCaseDto,
  HandlepCaseDto,
  DeleteDto,
} from './dto/update-case.dto';
import { Case } from './entities/case.entity';
import { CASES_BUTTONS_MAP_Value, CASE_STATUS } from './types';
import { User, USER_IDENTITY } from 'src/user/entities/user.entity';
import { Team } from 'src/team/entities/team.entity';
import * as dayjs from 'dayjs';
import { ChatService } from 'src/chat/chat.service';
import { ChatType } from 'src/chat/entities/chat.entity';

@Injectable()
export class CasesService {
  constructor(private chatService: ChatService) {}
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
      const isCase = session.userInfo.identity?.includes(USER_IDENTITY.PUBLIC);

      await this.caseRepository.save({
        ..._editCaseDto,
        userId: session.openid,
        avatarUrl: session.avatarUrl,
        status: _editCaseDto.isSubmit
          ? CASE_STATUS.WAIT_FOR_AUDIT
          : CASE_STATUS.DRAFT,
        type: isCase ? 2 : 1,
      });
    }

    return { success: true };
  }

  async detail(id: string, session: { userInfo: User }) {
    const caseFinded = await this.caseRepository.findOne({
      where: { id: Number(id) },
    });

    if (!caseFinded) {
      this.noCaseError(id);
    }
    const getButtons = async () => {
      const buttons: CASES_BUTTONS_MAP_Value = [];

      if (caseFinded.type === 2) {
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
          const team = session.userInfo.groupId
            ? await this.teamRepository.findOne({
                where: { id: session.userInfo.groupId },
                select: ['admins'],
              })
            : null;

          const isTeamAdmin = !!team?.admins?.includes(session.userInfo.id);

          if (session.userInfo.groupId === caseFinded.relateGroup) {
            if (isTeamAdmin) {
              buttons.push(4);
            }
          }
          if (caseFinded.status === CASE_STATUS.WAITTING && isTeamAdmin) {
            buttons.push(6);
          }
        }

        if (session.userInfo.identity.includes(USER_IDENTITY.MANAGER)) {
          buttons.push(7);
        }
      } else {
        if (caseFinded.userId === session.userInfo.id) {
          buttons.push(1);
          buttons.push(5);
        }

        if (session.userInfo.identity.includes(USER_IDENTITY.MANAGER)) {
          buttons.push(7);
        }
      }
      return buttons;
    };

    return {
      detail: {
        ...caseFinded,
        createTime: dayjs(caseFinded.createTime).format('YYYY-MM-DD HH:mm:ss'),
        buttons: await getButtons(),
      },
    };
  }

  async delete({ id }: DeleteDto, session: { userInfo: User }) {
    const caseFinded = await this.caseRepository.findOne({
      where: { id },
    });

    if (!caseFinded) {
      this.noCaseError(id);
    }

    if (caseFinded.userId === session.userInfo.id) {
      this.caseRepository
        .createQueryBuilder()
        .update(Case)
        .set({
          status: CASE_STATUS.DELETED,
        })
        .where('id=:id', { id })
        .execute();
      return {
        success: true,
      };
    } else {
      return this.notOwnCase();
    }
  }

  async audit({ id, auditComment, isPass }: AuditCaseDto, session) {
    if (!session.userInfo.identity.includes(USER_IDENTITY.MANAGER)) {
      this.noAuth();
    }
    const caseById = await this.caseRepository.findOne({ where: { id } });
    if (!caseById) {
      this.noCaseError(id);
    }
    const getStatus = () => {
      if (caseById.type === 1) {
        if (isPass) {
          return CASE_STATUS.POST_AUDITED;
        } else {
          return CASE_STATUS.NOT_AUDITED;
        }
      } else {
        if (isPass) {
          return CASE_STATUS.WAITTING;
        } else {
          return CASE_STATUS.NOT_AUDITED;
        }
      }
    };

    await this.caseRepository
      .createQueryBuilder()
      .update(Case)
      .set({
        auditComment,
        status: getStatus(),
      })
      .where('id=:id', { id })
      .execute();
    return { success: true };
  }

  async findAll(
    {
      pageNo,
      pageSize,
      userId,
      status,
      groupId,
      startTime,
      endTime,
      orderByTime = true,
      related,
      type,
    }: CaseListDto,
    session: { userInfo: User },
  ) {
    const skip = (pageNo - 1) * pageSize;
    let query = this.caseRepository.createQueryBuilder('case');
    if (related && !userId && !groupId) {
      query = query.where(
        '(case.userId = :userId OR case.relateGroup = :groupId OR JSON_CONTAINS(case.pendingRelateGroup, :value))',
        {
          userId: session.userInfo.id,
          groupId: session.userInfo.groupId,
          value: JSON.stringify(session.userInfo.groupId),
        },
      );
    } else {
      if (userId) query = query.where('case.userId = :userId', { userId });

      if (groupId)
        query = query.andWhere(
          '(case.relateGroup = :groupId OR JSON_CONTAINS(case.pendingRelateGroup, :value))',
          {
            groupId: session.userInfo.groupId,
            value: JSON.stringify(session.userInfo.groupId),
          },
        );
    }

    if (status && status.length)
      query = query.andWhere('case.status IN (:...status)', { status });

    if (startTime && endTime)
      query = query.andWhere('case.createTime BETWEEN :start AND :end', {
        start: startTime,
        end: endTime,
      });

    if (type)
      query = query.andWhere('case.type = :type', {
        type,
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

  async handle(
    { caseId, isHandle }: HandlepCaseDto,
    session: { userInfo: User },
  ) {
    const groupId = session.userInfo.groupId;
    const caseById = await this.caseRepository.findOne({
      where: { id: caseId },
    });
    if (!caseById) {
      return this.noCaseError(caseId);
    }
    const team = await this.teamRepository.findOne({
      where: { id: session.userInfo.groupId },
    });
    if (!team.admins?.find((item) => item === session.userInfo.id)) {
      return this.noAuth();
    }

    if (isHandle) {
      this.chatService.sendMessage({
        from: session.userInfo.id,
        to: caseById.userId,
        type: ChatType.TEAM_HANLDE_CASE,
        teamHanldeCaseInfo: {
          groupId: groupId,
          caseId: caseId,
        },
      });

      await this.caseRepository
        .createQueryBuilder()
        .update(Case)
        .set({
          pendingRelateGroup: Array.from(
            new Set([...(caseById.pendingRelateGroup || []), groupId]),
          ),
        })
        .where('id=:id', { id: caseId })
        .execute();
    } else {
      if (caseById.relateGroup === groupId) {
        await this.caseRepository
          .createQueryBuilder()
          .update(Case)
          .set({
            relateGroup: null,
            status: CASE_STATUS.WAITTING,
          })
          .where('id=:id', { id: caseId })
          .execute();
      } else {
        await this.caseRepository
          .createQueryBuilder()
          .update(Case)
          .set({
            pendingRelateGroup: caseById.pendingRelateGroup.filter(
              (item) => item !== groupId,
            ),
          })
          .where('id=:id', { id: caseId })
          .execute();
      }
    }
    return { success: true };
  }

  async agreeHandle(
    { caseId, groupId }: AgreeHandlepCaseDto,
    session: { userInfo: User },
  ) {
    const caseById = await this.caseRepository.findOne({
      where: { id: caseId },
    });
    if (!caseById) {
      return this.noCaseError(caseId);
    }
    const team = await this.teamRepository.findOne({
      where: { id: session.userInfo.groupId },
    });
    if (!team.admins?.find((item) => item === session.userInfo.id)) {
      return this.noAuth();
    }

    if (!caseById.pendingRelateGroup.includes(groupId)) {
      return this.groupHasGiveUp();
    }

    team.admins.forEach((item) => {
      this.chatService.sendMessage({
        from: session.userInfo.id,
        to: item,
        type: ChatType.PEOPLE_APPROVE_CASE,
        publicAgreeHandleInfo: {
          caseId: caseId,
        },
      });
    });

    await this.caseRepository
      .createQueryBuilder()
      .update(Case)
      .set({
        pendingRelateGroup: [],
        relateGroup: groupId,
        status: CASE_STATUS.PROCESSING,
      })
      .where('id=:id', { id: caseId })
      .execute();
    return { success: true };
  }

  async reEntrustGroup(
    { caseId }: ReEntrustCaseDto,
    session: { userInfo: User },
  ) {
    const caseById = await this.caseRepository.findOne({
      where: { id: caseId },
    });
    if (!caseById) {
      this.noCaseError(caseId);
    }

    if (caseById.userId !== session.userInfo.id) {
      return this.notOwnCase();
    }

    await this.caseRepository
      .createQueryBuilder()
      .update(Case)
      .set({
        relateGroup: null,
        status: CASE_STATUS.WAITTING,
      })
      .where('id=:id', { id: caseId })
      .execute();
    return { success: true };
  }

  noCaseError(id) {
    throw new HttpException(
      {
        errorno: 4,
        errormsg: `未找到id为${id}的帖子、案件`,
      },
      HttpStatus.OK,
    );
  }

  noAuth() {
    throw new HttpException(
      {
        errorno: 9,
        errormsg: `只有管理员可以审核`,
      },
      HttpStatus.OK,
    );
  }

  notOwnCase() {
    throw new HttpException(
      {
        errorno: 10,
        errormsg: `不是您的案件喔~`,
        data: {
          success: false,
        },
      },
      HttpStatus.OK,
    );
  }

  groupHasGiveUp() {
    throw new HttpException(
      {
        errorno: 11,
        errormsg: `该团队已经放弃受理`,
        data: {
          success: false,
        },
      },
      HttpStatus.OK,
    );
  }
}
