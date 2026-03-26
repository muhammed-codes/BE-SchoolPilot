import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAttendance } from './entities/student-attendance.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';
import { Term } from '../terms/entities/term.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceResolver } from './attendance.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentAttendance,
      StaffAttendance,
      ClassEntity,
      School,
      User,
      Term,
    ]),
  ],
  providers: [AttendanceService, AttendanceResolver],
  exports: [AttendanceService],
})
export class AttendanceModule {}
