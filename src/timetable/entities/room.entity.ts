import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { RoomType } from '../enums/timetable.enums';

@ObjectType()
@Entity('rooms')
export class Room extends BaseEntity {
  @Field()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 30 })
  capacity!: number;

  @Field(() => RoomType)
  @Column({ type: 'varchar', default: RoomType.CLASSROOM })
  type!: RoomType;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive!: boolean;
}
