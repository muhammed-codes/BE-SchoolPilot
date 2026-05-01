import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { ClassesService } from './classes.service';
import { ClassesResolver } from './classes.resolver';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, ClassSubject, Student])],
  providers: [ClassesService, ClassesResolver],
  exports: [ClassesService],
})
export class ClassesModule {}
