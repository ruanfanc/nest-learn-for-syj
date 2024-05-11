import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ChatType {
  NORMAL = 1,
  JOIN_TEAM_APPLY = 2,
  TEAM_HANLDE_CASE = 3,
  PEOPLE_APPROVE_CASE = 4,
  GROUP = 5,
  AGREE_JOIN_TEAM_APPLY = 6,
}

@Entity('message', { schema: 'younglaw' })
export class Message {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('text', { name: 'content' })
  content: string;

  @Column('varchar', { name: 'from' })
  from: string;

  @Column('varchar', { name: 'to' })
  to: string;

  @Column('text', { name: 'chatObjsReaded', nullable: true })
  chatObjsReaded: string;

  @Column('boolean', { name: 'isReaded', nullable: true })
  isReaded: boolean;

  @Column('int', { name: 'chatRoomId' })
  chatRoomId: number;

  @CreateDateColumn({ type: 'timestamp', name: 'createTime' })
  createTime: string;

  @Column('varchar', { name: 'nickName', length: 45, nullable: true })
  nickName: string;

  @Column('text', { name: 'avatarUrl', nullable: true })
  avatarUrl: string | null;
}

@Entity('chatRoom', { schema: 'younglaw' })
export class ChatRoom {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'chatRoomName' })
  chatRoomName: string;

  @Column('text', { name: 'chatObjIds', nullable: true })
  chatObjIds: string;

  @Column('json', { name: 'chatObjAvatarUrl', nullable: true })
  chatObjAvatarUrl: string[];

  @Column('text', { name: 'messagesIds', nullable: true })
  messagesIds: string;

  @Column('int', { name: 'type', default: 1 })
  type: ChatType;

  @Column('int', { name: 'caseId', nullable: true })
  caseId: number;

  @Column('json', { name: 'joinTeamApplyInfo', nullable: true })
  joinTeamApplyInfo?: {
    groupId: string;
    userId: number;
  };

  @Column('json', { name: 'teamHanldeCaseInfo', nullable: true })
  teamHanldeCaseInfo?: {
    groupId: string;
    caseId: number;
  };

  @Column('json', { name: 'publicAgreeHandleInfo', nullable: true })
  publicAgreeHandleInfo?: {
    caseId: number;
  };
}

// @Entity('chatRoomMessageRelate', { schema: 'younglaw' })
// export class ChatRoomMessageRelate {
//   @PrimaryColumn({ type: 'int', name: 'roomId' })
//   roomId: number;

//   @PrimaryColumn({ type: 'int', name: 'messageId' })
//   messageId: number;

//   @ManyToOne(() => ChatRoom, chatRoom => chatRoom.chatRoomMessages)
//   chatRoom: ChatRoom;

//   @ManyToOne(() => Message, message => message.chatRoomMessages)
//   message: Message;
// }

// @Entity('chatRoomUserRelate', { schema: 'younglaw' })
// export class ChatRoomUserRelate {
//   @PrimaryColumn({ type: 'int', name: 'roomId' })
//   roomId: number;

//   @PrimaryColumn({ type: 'varchar', name: 'userId' })
//   userId: string;
// }
