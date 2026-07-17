import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { IdCardsService } from './id-cards.service';
import { IdCardsResolver } from './id-cards.resolver';
import { SchoolsModule } from '../schools/schools.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SchoolsModule,
  ],
  providers: [IdCardsService, IdCardsResolver],
  exports: [IdCardsService],
})
export class IdCardsModule {}
