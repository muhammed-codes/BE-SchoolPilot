import { Module } from '@nestjs/common';
import { MarketingContentService } from './marketing-content.service';
import { MarketingResolver } from './marketing.resolver';

@Module({
  providers: [MarketingContentService, MarketingResolver],
})
export class MarketingModule {}
