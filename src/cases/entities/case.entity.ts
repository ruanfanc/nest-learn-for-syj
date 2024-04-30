import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CASE_STATUS, CASE_TYPE_MAP_VALUE } from '../types';

@Entity('cases', { schema: 'younglaw' })
export class Case {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'contentText', nullable: false })
  contentText: string;

  @Column('json', { name: 'caseType', nullable: true })
  caseType: CASE_TYPE_MAP_VALUE;
  /** 每当案件被审核时加上该标记true，每当案件被编辑，更新它的审核状态为false */
  @Column('boolean', { name: 'isAudited', nullable: true })
  isAudited: boolean;

  @Column('text', { name: 'auditComment', nullable: true })
  auditComment: string;

  @Column('json', { name: 'imgSrcs', nullable: true })
  imgSrcs: string[];

  @Column('text', { name: 'avatarUrl', nullable: true })
  avatarUrl: string;

  @CreateDateColumn({ type: 'timestamp', name: 'createTime' })
  createTime: string;

  @Column('varchar', { name: 'userId', length: 45 })
  userId: string;

  @Column('varchar', { name: 'relateGroup', length: 45, nullable: true })
  relateGroup: string;

  @Column('json', { name: 'pendingRelateGroup', nullable: true })
  pendingRelateGroup: string[];

  @Column('boolean', { name: 'isSubmit', nullable: true })
  isSubmit: boolean;

  @Column('boolean', { name: 'isPass', nullable: true, default: false })
  isPass: boolean;

  @Column('int', { name: 'status', nullable: true })
  status: CASE_STATUS;

  @Column('int', { name: 'type' })
  type: 2 | 1;
}
