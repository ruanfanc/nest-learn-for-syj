import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom, ChatType, Message } from './entities/chat.entity';
import { Case } from 'src/cases/entities/case.entity';
import { User } from 'src/user/entities/user.entity';
import { joinStringSet } from 'src/common/utils';

@Injectable()
export class ChatService {
  constructor() {}
  @InjectRepository(Message) private messageRepository: Repository<Message>;
  @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>;
  @InjectRepository(User) private userRepository: Repository<User>;
  @InjectRepository(Case) private casesRepository: Repository<Case>;

  async sendMessage({
    from,
    to,
    type,
    teamHanldeCaseInfo,
    joinTeamApplyInfo,
    publicAgreeHandleInfo,
    agreeJoinTeamApplyInfo,
    groupApplyCompleteCaseInfo,
    caseBeAgreededCompleteInfo,
  }: {
    from: string;
    to: string;
    type: ChatType;
    joinTeamApplyInfo?: {
      groupId: string;
      userId: string;
    };
    agreeJoinTeamApplyInfo?: {
      groupId: string;
      userId: string;
    };
    teamHanldeCaseInfo?: {
      groupId: string;
      caseId: number;
    };
    publicAgreeHandleInfo?: {
      caseId: number;
      groupId: string;
    };
    groupApplyCompleteCaseInfo?: {
      caseId: number;
      groupId: string;
    };
    caseBeAgreededCompleteInfo?: {
      caseId: number;
    };
  }) {
    let user: User;
    let chatRoom: ChatRoom;
    const hadChatRoom = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .where(
        'FIND_IN_SET(chatRoom.chatObjIds, :chatObjIds) AND chatRoom.type = :type AND chatRoom.isWaitingConfirmInfo = :isWaitingConfirmInfo',
        {
          chatObjIds: [to, from].join(','),
          type,
          isWaitingConfirmInfo: true,
        },
      )
      .getOne();

    if (hadChatRoom) {
      return;
    }

    switch (type) {
      case ChatType.JOIN_TEAM_APPLY: {
        if (!joinTeamApplyInfo) {
          throw new HttpException(
            {
              errorno: 16,
              errormsg: '缺少joinTeamApplyInfo',
              data: {
                success: false,
              },
            },
            HttpStatus.OK,
          );
        }

        user = await this.userRepository.findOne({
          where: { id: joinTeamApplyInfo.userId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: to,
          chatRoomName: `${user.nickName}申请加入您的团队`,
          type,
          joinTeamApplyInfo,
          chatObjAvatarUrl: [user.avatarUrl],
          isWaitingConfirmInfo: true,
        } as unknown as ChatRoom);

        break;
      }

      case ChatType.AGREE_JOIN_TEAM_APPLY: {
        if (!agreeJoinTeamApplyInfo) {
          throw new HttpException(
            {
              errorno: 20,
              errormsg: '缺少agreeJoinTeamApplyInfo',
              data: {
                success: false,
              },
            },
            HttpStatus.OK,
          );
        }

        user = await this.userRepository.findOne({
          where: { id: agreeJoinTeamApplyInfo.userId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: to,
          chatRoomName: `您已加入团队：${agreeJoinTeamApplyInfo.groupId}`,
          type,
          agreeJoinTeamApplyInfo,
          chatObjAvatarUrl: [user.avatarUrl],
          isWaitingConfirmInfo: true,
        } as unknown as ChatRoom);

        break;
      }

      case ChatType.PEOPLE_APPROVE_CASE: {
        if (!publicAgreeHandleInfo) {
          throw new HttpException(
            {
              errorno: 17,
              errormsg: '缺少publicAgreeHandleInfo',
              data: {
                success: false,
              },
            },
            HttpStatus.OK,
          );
        }

        user = await this.userRepository.findOne({
          where: { id: from },
        });

        const caseDetail = await this.casesRepository.findOne({
          where: { id: publicAgreeHandleInfo.caseId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: to,
          chatRoomName: `${user.nickName}同意了您受理案件：${caseDetail.title}`,
          type,
          publicAgreeHandleInfo,
          chatObjAvatarUrl: [user.avatarUrl],
          isWaitingConfirmInfo: true,
        } as unknown as ChatRoom);
        break;
      }
      case ChatType.TEAM_HANLDE_CASE: {
        if (!teamHanldeCaseInfo) {
          throw new HttpException(
            {
              errorno: 18,
              errormsg: '缺少teamHanldeCaseInfo',
              data: {
                success: false,
              },
            },
            HttpStatus.OK,
          );
        }

        user = await this.userRepository.findOne({
          where: { id: from },
        });

        const caseDetail = await this.casesRepository.findOne({
          where: { id: teamHanldeCaseInfo.caseId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: to,
          chatRoomName: `${teamHanldeCaseInfo.groupId}申请受理您的案件：${caseDetail.title}`,
          type,
          teamHanldeCaseInfo,
          chatObjAvatarUrl: [user.avatarUrl],
          isWaitingConfirmInfo: true,
        } as unknown as ChatRoom);
        break;
      }

      case ChatType.GROUP_APPLY_COMPLETE_CASE: {
        if (!groupApplyCompleteCaseInfo) {
          throw new HttpException(
            {
              errorno: 23,
              errormsg: '缺少groupApplyCompleteCase',
              data: {
                success: false,
              },
            },
            HttpStatus.OK,
          );
        }

        user = await this.userRepository.findOne({
          where: { id: from },
        });

        const caseDetail = await this.casesRepository.findOne({
          where: { id: groupApplyCompleteCaseInfo.caseId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: to,
          chatRoomName: `${groupApplyCompleteCaseInfo.groupId}申请完结您的案件的全部流程（案件已成功处理）：${caseDetail.title}`,
          type,
          groupApplyCompleteCaseInfo,
          chatObjAvatarUrl: [user.avatarUrl],
          isWaitingConfirmInfo: true,
        } as unknown as ChatRoom);
        break;
      }

      case ChatType.CASE_BE_AGREEDED_COMPLETE: {
        if (!caseBeAgreededCompleteInfo) {
          throw new HttpException(
            {
              errorno: 23,
              errormsg: '缺少caseBeAgreededCompleteInfo',
              data: {
                success: false,
              },
            },
            HttpStatus.OK,
          );
        }

        user = await this.userRepository.findOne({
          where: { id: from },
        });

        const caseDetail = await this.casesRepository.findOne({
          where: { id: caseBeAgreededCompleteInfo.caseId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: to,
          chatRoomName: `${user.nickName}同意了您完结案件：${caseDetail.title}`,
          type,
          caseBeAgreededCompleteInfo,
          chatObjAvatarUrl: [user.avatarUrl],
          isWaitingConfirmInfo: true,
        } as unknown as ChatRoom);
        break;
      }
      default:
        break;
    }

    this.userRepository
      .createQueryBuilder('user')
      .update(User)
      .set({
        chatGroups: () => joinStringSet('user.chatGroups', chatRoom.id),
      })
      .where('id=:id', { id: to })
      .execute();
  }
}
