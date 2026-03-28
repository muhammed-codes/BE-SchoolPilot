import { PdfService } from './pdf.service';
import { BulkPDFResult } from './dto/pdf.dto';
export declare class PdfResolver {
    private readonly pdfService;
    constructor(pdfService: PdfService);
    generateReportCard(studentResultId: string): Promise<string>;
    generateBulkReportCards(resultSheetId: string): Promise<BulkPDFResult>;
}
