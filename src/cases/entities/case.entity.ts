import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CASE_STATUS, CASE_TYPE_MAP_VALUE } from '../types';

@Entity('case', { schema: 'younglaw' })
export class Case {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'contentText', nullable: false })
  contentText: string;

  @Column('json', { name: 'caseType', nullable: true })
  caseType: CASE_TYPE_MAP_VALUE;

  @Column('text', { name: 'auditComment', nullable: true })
  auditComment: string;

  @Column('json', { name: 'imgSrcs', nullable: true })
  imgSrcs: string[];

  @Column('text', { name: 'avatarUrl', nullable: true })
  avatarUrl: string;

  @Column('varchar', { name: 'createTime', length: 45 })
  createTime: string;

  @Column('varchar', { name: 'username', length: 45 })
  username: string;

  @Column('varchar', { name: 'userdesc', length: 45, nullable: true })
  userdesc: string;

  @Column('boolean', { name: 'isSubmit', nullable: true })
  isSubmit: boolean;

  @Column('boolean', { name: 'isPass', nullable: true, default: false })
  isPass: boolean;

  @Column('int', { name: 'status', nullable: true })
  status: CASE_STATUS;

  @Column('int', { name: 'type' })
  type: 1 | 0;
}
