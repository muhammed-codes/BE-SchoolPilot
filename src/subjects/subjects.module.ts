import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { SubjectsService } from './subjects.service';
import { SubjectsResolver } from './subjects.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  providers: [SubjectsService, SubjectsResolver],
  exports: [SubjectsService],
})
export class SubjectsModule {}
