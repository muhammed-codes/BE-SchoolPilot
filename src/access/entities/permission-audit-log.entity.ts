import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('permission_audit_logs')
@Index('IDX_permission_audit_logs_school_created', ['schoolId', 'createdAt'])
@Index('IDX_permission_audit_logs_target', ['targetType', 'targetId'])
export class PermissionAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  schoolId!: string;

  @Column({ type: 'uuid' })
  actorUserId!: string;

  @Column({ type: 'varchar', length: 64 })
  targetType!: string;

  @Column({ type: 'uuid', nullable: true })
  targetId!: string | null;

  @Column({ type: 'varchar', length: 64 })
  operation!: string;

  @Column({ type: 'jsonb', nullable: true })
  beforeState!: unknown;

  @Column({ type: 'jsonb', nullable: true })
  afterState!: unknown;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
