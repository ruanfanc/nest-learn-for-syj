import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom, ChatType, Message } from './entities/chat.entity';
import { Case } from 'src/cases/entities/case.entity';
import { User } from 'src/user/entities/user.entity';
import { joinStringSet } from 'src/common/utils';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as dayjs from 'dayjs';
import { ChatGateway } from './chat.gateway';
import { Team } from 'src/team/entities/team.entity';

@Injectable()
export class ChatService {
  constructor(private chatGateway: ChatGateway) {}

  @InjectRepository(Message) private messageRepository: Repository<Message>;
  @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>;
  @InjectRepository(User) private userRepository: Repository<User>;
  @InjectRepository(Case) private casesRepository: Repository<Case>;
  @InjectRepository(Team) private teamRepository: Repository<Team>;

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
    groupAgreePeopleEntrustCase,
    peopleEntrustGroupCase,
  }: {
    from: string;
    to?: string;
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
    peopleEntrustGroupCase?: {
      caseId: number;
      userName: string;
    };
    groupAgreePeopleEntrustCase?: {
      caseId: number;
      groupId: string;
    };
  }) {
    let user: User;
    let chatRoom: ChatRoom;
    let teamMates: User[];
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

        teamMates = await this.userRepository
          .createQueryBuilder('user')
          .where('user.groupId = :value', {
            value: publicAgreeHandleInfo.groupId,
          })
          .getMany();

        const team = await this.teamRepository.findOne({
          where: { id: publicAgreeHandleInfo.groupId },
        });

        const caseDetail = await this.casesRepository.findOne({
          where: { id: publicAgreeHandleInfo.caseId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: [user.id, ...teamMates.map((item) => item.id)].join(','),
          chatRoomName: caseDetail.title,
          type: ChatType.GROUP,
          chatObjAvatarUrl: [team.avatarUrl],
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
      case ChatType.PEOPLE_ENTRUST_GROUP_CASE: {
        if (!peopleEntrustGroupCase) {
          throw new HttpException(
            {
              errorno: 28,
              errormsg: '缺少peopleEntrustGroupCase',
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

        const group = await this.teamRepository.findOne({
          where: { id: user.groupId },
        });

        if (!group) {
          throw new HttpException(
            {
              errorno: 31,
              errormsg: '用户无所属团队',
              data: {
                success: false,
              },
            },
            HttpStatus.OK,
          );
        }

        teamMates = await this.userRepository
          .createQueryBuilder()
          .whereInIds(group.admins?.map((item) => item.id) || [])
          .getMany();

        const caseDetail = await this.casesRepository.findOne({
          where: { id: peopleEntrustGroupCase.caseId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: to,
          chatRoomName: `${user.nickName}希望您受理案件：${caseDetail.title}`,
          type,
          peopleEntrustGroupCase,
          chatObjAvatarUrl: [user.avatarUrl],
          isWaitingConfirmInfo: true,
        } as unknown as ChatRoom);
        break;
      }
      case ChatType.GROUP_AGREE_PEOPLE_ENTRUST_CASE: {
        if (!groupAgreePeopleEntrustCase) {
          throw new HttpException(
            {
              errorno: 29,
              errormsg: '缺少groupAgreePeopleEntrustCase',
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
          where: { id: groupAgreePeopleEntrustCase.caseId },
        });

        chatRoom = await this.chatRoomRepository.save({
          chatObjIds: to,
          chatRoomName: `${user.nickName}同意受理案件：${caseDetail.title}`,
          type,
          groupAgreePeopleEntrustCase,
          chatObjAvatarUrl: [user.avatarUrl],
          isWaitingConfirmInfo: true,
        } as unknown as ChatRoom);
        break;
      }
      default:
        break;
    }

    if (to) {
      await this.userRepository
        .createQueryBuilder('user')
        .update(User)
        .set({
          chatGroups: () => joinStringSet('user.chatGroups', chatRoom.id),
        })
        .where('id=:id', { id: to })
        .execute();
    }

    if (type === ChatType.PEOPLE_APPROVE_CASE) {
      await this.chatGateway.send({
        userId: user.id,
        content: '已同意受理案件',
        chatRoomId: chatRoom.id,
        notRead: true,
      });

      [...teamMates, user].forEach(async (item) => {
        await this.userRepository
          .createQueryBuilder('user')
          .update(User)
          .set({
            chatGroups: () => joinStringSet('user.chatGroups', chatRoom.id),
          })
          .where('id=:id', { id: item.id })
          .execute();

        this.chatGateway.newMessagesPreviewList({
          userId: item.id,
        } as any);
      });
    } else if (type === ChatType.PEOPLE_ENTRUST_GROUP_CASE) {
      teamMates.forEach(async (item) => {
        await this.userRepository
          .createQueryBuilder('user')
          .update(User)
          .set({
            chatGroups: () => joinStringSet('user.chatGroups', chatRoom.id),
          })
          .where('id=:id', { id: item.id })
          .execute();

        this.chatGateway.newMessagesPreviewList({
          userId: item.id,
        } as any);
      });
    } else if (to) {
      this.chatGateway.newMessagesPreviewList({
        userId: to,
      } as any);
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS) // 每小时检查一次
  async handleCron() {
    console.log('Checking for unread messages...');
    const accessTokenData = await axios.get(
      'https://api.weixin.qq.com/cgi-bin/token?appid=wx559e4273b8badf2a&secret=7b8954140d68ecf74f21f53b058138e6&grant_type=client_credential',
    );

    // 查询数据库中的未读消息
    const unreadMessages = await this.messageRepository
      .createQueryBuilder('message')
      .where(`message.isReaded is NULL`)
      .getMany();

    const unreadChat = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .where(`chatRoom.isWaitingConfirmInfo = 1`)
      .getMany();

    this.messageRepository.delete({ isReaded: true });
    await this.chatRoomRepository.delete({
      isWaitingConfirmInfo: 0,
    });

    const allChatRooms = await this.chatRoomRepository.find();
    const allUsers = await this.userRepository.find();
    const deleteChatRoomSet = new Set(allChatRooms.map((item) => item.id));

    // 清理无用的chatGroup
    allUsers.forEach((item) => {
      const chatGroupSet = new Set(item.chatGroups?.split(','));

      chatGroupSet.forEach((item) => {
        if (!deleteChatRoomSet.has(Number(item))) {
          chatGroupSet.delete(item);
        }
      });

      this.userRepository
        .createQueryBuilder('user')
        .update(User)
        .set({
          chatGroups: Array.from(chatGroupSet).join(',') + ',',
        })
        .where('user.id = :id', { id: item.id })
        .execute();
    });

    const postUsers = new Map<string, number>();

    unreadMessages.forEach(async (item) => {
      if (item.to.includes('@')) {
        const chatRoom = await this.chatRoomRepository.findOne({
          where: { id: item.chatRoomId },
        });
        const chatObjIdsSet = new Set(
          chatRoom.chatObjIds?.split(',') as string[],
        );
        item.chatObjsReaded?.split(',').forEach((item) => {
          if (chatObjIdsSet.has(item)) {
            chatObjIdsSet.delete(item);
          }
        });

        chatObjIdsSet.forEach((item) => {
          const unreadNum = postUsers.get(item) || 0;
          postUsers.set(item, unreadNum + 1);
        });
      } else {
        const unreadNum = postUsers.get(item.to) || 0;
        postUsers.set(item.to, unreadNum + 1);
      }
    });

    unreadChat.forEach((item) => {
      const unreadNum = postUsers.get(item.chatObjIds?.split(',')[0]) || 0;
      postUsers.set(item.chatObjIds?.split(',')[0], unreadNum + 1);
    });

    const time = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss');

    // 推送未读消息
    postUsers.forEach(async (item, key) => {
      axios
        .post(
          `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessTokenData.data.access_token}`,
          {
            template_id: '9uYUq3WytK06SBOKqAmhBqjfNdp_01fKvUkhSrdAbDE',
            page: 'pages/index/index',
            touser: key,
            data: {
              thing7: {
                value: `您有${item}条未读消息，请进入小程序及时查看`,
              },
              time5: {
                value: time,
              },
            },
          },
        )
        .then((res) => {
          console.log(key, res.data);
        });
    });
  }
}
