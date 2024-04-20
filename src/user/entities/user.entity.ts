import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user', { schema: 'younglaw' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'openid', unique: true, length: 45 })
  openid: string;

  @Column('varchar', { name: 'nickName', length: 45 })
  nickName: string;

  @Column('int', { name: 'groupId', nullable: true })
  groupId: number;

  @Column('varchar', {
    name: 'identityID',
    nullable: true,
    unique: true,
    length: 45,
  })
  identityID: string;

  @Column('text', { name: 'avatarUrl', nullable: true })
  avatarUrl: string | null;

  @Column('json', { name: 'identity', nullable: true })
  identity: USER_IDENTITY | null;

  @Column('text', { name: 'confirmCode', nullable: true })
  confirmCode: string | null;
}

export enum USER_IDENTITY {
  STUDENT = 1,
  TEACHER = 2,
  /** 公众 */
  PUBLIC = 3,
  MANAGER = 4,
}
