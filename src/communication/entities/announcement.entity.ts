import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum AnnouncementAudience {
  SCHOOL = 'school',
  STAFF = 'staff',
  GUARDIANS = 'guardians',
  CLASS = 'class',
}

export enum AnnouncementStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

registerEnumType(AnnouncementAudience, { name: 'AnnouncementAudience' });
registerEnumType(AnnouncementStatus, { name: 'AnnouncementStatus' });

@ObjectType()
@Entity('announcements')
@Index('IDX_announcements_school_status', ['schoolId', 'status'])
export class Announcement extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column({ type: 'uuid' })
  createdById!: string;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column({ type: 'text' })
  body!: string;

  @Field(() => AnnouncementAudience)
  @Column({ type: 'enum', enum: AnnouncementAudience })
  audience!: AnnouncementAudience;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  targetClassId!: string | null;

  @Field(() => AnnouncementStatus)
  @Column({
    type: 'enum',
    enum: AnnouncementStatus,
    default: AnnouncementStatus.DRAFT,
  })
  status!: AnnouncementStatus;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;
}
