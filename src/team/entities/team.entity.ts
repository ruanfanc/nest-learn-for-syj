import { databaseName } from 'src/common/constant';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export const enum AuthLevel {
  TEACHER = 1,
  LEARDER = 2,
  MANAGER = 3,
  MATES = 4,
}

@Entity('team', { schema: databaseName })
export class Team {
  @PrimaryColumn({ type: 'varchar', name: 'id' })
  id: string;

  @Column('json', { name: 'admins' })
  admins: {
    id: string;
    /**
     * ● 老师默认为权限等级1，团队唯一，拥有所有权限
     * ● 队长默认为权限等级2，团队唯一，不拥有删除老师权限
     * ● 管理员为权限等级3，不唯一，不拥有增删管理员权限
     * ● 成员权限4，不唯一，不拥有增删成员权限
     */
    level: AuthLevel;
  }[];

  @Column('boolean', { name: 'hasTeacher', nullable: true })
  hasTeacher: boolean;

  @Column('text', { name: 'introduction', nullable: true })
  introduction: string;

  @Column('text', { name: 'avatarUrl', nullable: true })
  avatarUrl: string | null;

  @Column('int', { name: 'completedCaseCount', nullable: true, default: 0 })
  completedCaseCount: number;
}
