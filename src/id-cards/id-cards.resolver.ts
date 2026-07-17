import { Resolver } from '@nestjs/graphql';
import { IdCardsService } from './id-cards.service';

// ID card generation is now handled entirely on the frontend.
// This resolver is kept as a placeholder in case server-side queries are needed in the future.
@Resolver()
export class IdCardsResolver {
  constructor(private readonly idCardsService: IdCardsService) {}
}
