import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { JwtAuthGuard, PermissionGuard, RolesGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { UserRole } from '../common/enums';
import { AppResource } from '../access/enums/resource.enum';

@Resolver()
export class PdfResolver {
  constructor(private readonly pdfService: PdfService) {}

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canRead')
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.RESULTS, 'canRead')
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
