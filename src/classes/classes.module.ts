import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { ClassesService } from './classes.service';
import { ClassesResolver } from './classes.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, ClassSubject])],
  providers: [ClassesService, ClassesResolver],
  exports: [ClassesService],
})
export class ClassesModule {}
