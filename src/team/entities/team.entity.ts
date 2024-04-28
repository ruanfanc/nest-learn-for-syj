import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('team', { schema: 'younglaw' })
export class Team {
  @PrimaryColumn({ type: 'varchar', name: 'id' })
  id: string;

  @Column('json', { name: 'admins' })
  admins: string[];
}
