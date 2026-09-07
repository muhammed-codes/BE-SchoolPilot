import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Term } from '../terms/entities/term.entity';
import { ClassesModule } from '../classes/classes.module';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, User, ClassEntity, Term]),
    ClassesModule,
  ],
  providers: [DashboardService, DashboardResolver],
})
export class DashboardModule {}
