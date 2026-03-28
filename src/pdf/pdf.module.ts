import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf.service';
import { PdfResolver } from './pdf.resolver';
import { UploadModule } from '../upload/upload.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { StudentResult } from '../results/entities/student-result.entity';
import { ResultSheet } from '../results/entities/result-sheet.entity';
import { Student } from '../students/entities/student.entity';
import { School } from '../schools/entities/school.entity';
import { Term } from '../terms/entities/term.entity';
import { Session } from '../terms/entities/session.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentResult,
      ResultSheet,
      Student,
      School,
      Term,
      Session,
      ClassEntity,
      Subject,
    ]),
    UploadModule,
    AttendanceModule,
  ],
  providers: [PdfService, PdfResolver],
  exports: [PdfService],
})
export class PdfModule {}
