import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { BulkPDFResult } from './dto/pdf.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';

@Resolver()
export class PdfResolver {
  constructor(private readonly pdfService: PdfService) {}

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  generateReportCard(
    @Args('studentResultId') studentResultId: string,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    return this.pdfService.generateReportCard(
      studentResultId,
      user.sub,
      user.schoolId,
      user.role,
    );
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  generateBulkReportCards(
    @Args('resultSheetId') resultSheetId: string,
    @CurrentUser() user: { sub: string; schoolId: string; role: UserRole },
  ) {
    return this.pdfService.generateBulkReportCards(
      resultSheetId,
      user.sub,
      user.schoolId,
      user.role,
    );
  }
}
