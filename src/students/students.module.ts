import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentParent } from './entities/student-parent.entity';
import { AdmissionSequence } from './entities/admission-sequence.entity';
import { StudentsService } from './students.service';
import { StudentsResolver } from './students.resolver';
import { UsersModule } from '../users/users.module';
import { UploadModule } from '../upload/upload.module';
import { ClassesModule } from '../classes/classes.module';
import { SchoolsModule } from '../schools/schools.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, StudentParent, AdmissionSequence]),
    UsersModule,
    UploadModule,
    ClassesModule,
    SchoolsModule,
  ],
  providers: [StudentsService, StudentsResolver],
  exports: [StudentsService],
})
export class StudentsModule {}
