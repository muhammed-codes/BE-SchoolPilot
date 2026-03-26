import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { Term } from './entities/term.entity';
import { TermsService } from './terms.service';
import { TermsResolver } from './terms.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Term])],
  providers: [TermsService, TermsResolver],
  exports: [TermsService],
})
export class TermsModule {}
