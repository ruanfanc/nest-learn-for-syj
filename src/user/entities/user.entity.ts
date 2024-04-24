import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('user', { schema: 'younglaw' })
export class User {
  @PrimaryColumn({ type: 'varchar', name: 'id' })
  id: string;

  @Column('varchar', { name: 'nickName', length: 45 })
  nickName: string;

  @Column('text', { name: 'groupId', nullable: true })
  groupId: string;

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

  @Column('json', { name: 'talent', nullable: true })
  talent: number[];

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
