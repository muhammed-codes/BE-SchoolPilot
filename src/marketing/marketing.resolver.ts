import { Query, Resolver } from '@nestjs/graphql';
import { MarketingContentService } from './marketing-content.service';

@Resolver()
export class MarketingResolver {
  constructor(private readonly marketingContentService: MarketingContentService) {}

  @Query(() => String)
  marketingLandingPage = (): string => this.marketingContentService.getLandingPage();
}
