import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { SchoolDay } from './entities/school-day.entity';
import { Period } from './entities/period.entity';
import { NonTeachingSlot } from './entities/non-teaching-slot.entity';
import { TeacherAvailability } from './entities/teacher-availability.entity';
import { TimetableEntry } from './entities/timetable-entry.entity';
import { User } from '../users/entities/user.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { ClassSubject } from '../classes/entities/class-subject.entity';
import { Student } from '../students/entities/student.entity';
import { StudentParent } from '../students/entities/student-parent.entity';
import { Term } from '../terms/entities/term.entity';
import { School } from '../schools/entities/school.entity';
import { TimetableService } from './services/timetable.service';
import { ConflictValidatorService } from './services/conflict-validator.service';
import { TimetableResolver } from './resolvers/timetable.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      SchoolDay,
      Period,
      NonTeachingSlot,
      TeacherAvailability,
      TimetableEntry,
      User,
      ClassEntity,
      Subject,
      ClassSubject,
      Student,
      StudentParent,
      Term,
      School,
    ]),
  ],
  providers: [TimetableService, ConflictValidatorService, TimetableResolver],
  exports: [TimetableService],
})
export class TimetableModule {}
