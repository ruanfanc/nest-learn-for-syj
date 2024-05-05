import { Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

enum chatType {
  NORMAL = 1,
  TEAM = 2,
  CASE = 3,
  APPROVECASE = 4,
}

export class Chat {
  @PrimaryGeneratedColumn({ type: 'int', name: 'msgId' })
  msgId: number;

  @Column('text', { name: 'msg' })
  msg: string;

  @Column('varchar', { name: 'from' })
  from: string;

  @Column('varchar', { name: 'to' })
  to: string;

  @CreateDateColumn({ type: 'timestamp', name: 'createTime' })
  createTime: string;

  @Column('int', { name: 'type', default: 1 })
  type: chatType;

  @Column('varchar', { name: 'caseId', nullable: true })
  caseId: string;
}
