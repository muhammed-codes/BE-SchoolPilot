import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultSheet } from './entities/result-sheet.entity';
import { StudentResult } from './entities/student-result.entity';
import { SubjectScore } from './entities/subject-score.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ClassSubject } from '../classes/entities/class-subject.entity';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { Term } from '../terms/entities/term.entity';
import { User } from '../users/entities/user.entity';
import { ResultsService } from './results.service';
import { ResultsResolver } from './results.resolver';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResultSheet,
      StudentResult,
      SubjectScore,
      ClassEntity,
      ClassSubject,
      Student,
      StudentParent,
      Term,
      User,
    ]),
    NotificationsModule,
  ],
  providers: [ResultsService, ResultsResolver],
  exports: [ResultsService],
})
export class ResultsModule {}
