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

  @Column('number', { name: 'caseType', nullable: true })
  caseType: CASE_TYPE_MAP_VALUE;

  @Column('text', { name: 'auditComment', nullable: false })
  auditComment: string;

  @Column('json', { name: 'imgSrcs', nullable: true })
  imgSrcs: string[];

  @Column('text', { name: 'avatarUrl', nullable: false })
  avatarUrl: string;

  @Column('varchar', { name: 'createTime', length: 45 })
  createTime: string;

  @Column('varchar', { name: 'username', length: 45 })
  username: string;

  @Column('varchar', { name: 'userdesc', length: 45 })
  userdesc: string;

  @Column('int', { name: 'status', nullable: true })
  status: CASE_STATUS;
}
