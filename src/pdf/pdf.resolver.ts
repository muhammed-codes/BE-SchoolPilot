import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { BulkPDFResult } from './dto/pdf.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Resolver()
export class PdfResolver {
  constructor(private readonly pdfService: PdfService) {}

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  generateReportCard(@Args('studentResultId') studentResultId: string) {
    return this.pdfService.generateReportCard(studentResultId);
  }

  @Mutation(() => BulkPDFResult)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  generateBulkReportCards(@Args('resultSheetId') resultSheetId: string) {
    return this.pdfService.generateBulkReportCards(resultSheetId);
  }
}
