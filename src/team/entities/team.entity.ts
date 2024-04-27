import { Column, PrimaryColumn } from 'typeorm';

export class Team {
  @PrimaryColumn({ type: 'varchar', name: 'id' })
  id: string;

  @Column('json', { name: 'admins' })
  admins: string[];
}
