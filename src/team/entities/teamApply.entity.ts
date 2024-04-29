import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('teamApply', { schema: 'younglaw' })
export class TeamApply {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'userId', length: 45 })
  userId: string;

  @Column('varchar', { name: 'groupId', length: 45 })
  groupId: string;

  @Column('int', { name: 'status', nullable: true, default: 0 })
  status: TeamApplyEnum;

  @Column('text', { name: 'createTime' })
  createTime: string;
}

enum TeamApplyEnum {
  APPLYING = 0,
  AGREED = 1,
  REFUSED = 2,
}
