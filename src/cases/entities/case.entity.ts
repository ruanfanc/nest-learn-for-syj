import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import { CASES_BUTTONS_MAP_Value, CASE_STATUS, CASE_TYPE_MAP_VALUE } from "../types"

@Entity("user", { schema: "younglaw" })
export class Case {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number

  @Column("varchar", { name: "nickName", length: 45 })
  title: string

  @Column("text", { name: "avatarUrl", nullable: false })
  contentText: string

  @Column("json", { name: "identity", nullable: true })
  caseType: CASE_TYPE_MAP_VALUE

  @Column("json", { name: "imgSrcs", nullable: true })
  imgSrcs: string[]

  @Column("text", { name: "avatarUrl", nullable: false })
  avatarUrl: string

  @Column("varchar", { name: "nickName", length: 45 })
  createTime: string

  @Column("varchar", { name: "nickName", length: 45 })
  username: string

  @Column("varchar", { name: "nickName", length: 45 })
  userdesc: string

  @Column("int", { name: "status", nullable: true })
  status: CASE_STATUS
}
