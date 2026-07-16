import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ResultsService } from '../src/results/results.service';
import { ResultStatus } from '../src/common/enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResultSheet } from '../src/results/entities/result-sheet.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const resultsService = app.get(ResultsService);
  const resultSheetRepo = app.get<Repository<ResultSheet>>(
    getRepositoryToken(ResultSheet),
  );

  const sheets = await resultSheetRepo.find({
    where: [
      { status: ResultStatus.SCORES_ENTERED },
      { status: ResultStatus.PUBLISHED },
    ],
  });

  console.log(`Found ${sheets.length} sheets to fix.`);

  for (const sheet of sheets) {
    try {
      await resultsService.calculatePositions(sheet.id);
      console.log(`Fixed sheet ${sheet.id}`);
    } catch (err) {
      console.error(`Failed on sheet ${sheet.id}:`, err);
    }
  }

  await app.close();
  console.log('Done.');
}

bootstrap();
