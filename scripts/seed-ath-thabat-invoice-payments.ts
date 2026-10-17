import { FeesService } from '../src/fees/fees.service';
import { InvoiceStatus, StudentInvoice } from '../src/fees/entities/student-invoice.entity';
import { Student } from '../src/students/entities/student.entity';
import { User } from '../src/users/entities/user.entity';

export const seedAthThabatInvoicePayments = async (
  feesService: FeesService,
  studentsByClass: Student[][],
  sessionId: string,
  termId: string,
  schoolId: string,
  recordedBy: User,
) => {
  const counts = { paid: 0, partiallyPaid: 0, unpaid: 0 };

  for (const classStudents of studentsByClass) {
    for (const [index, student] of classStudents.entries()) {
      let invoice: StudentInvoice = await feesService.getInvoice(
        student.id,
        sessionId,
        termId,
        schoolId,
      );
      const paymentScenario = index % 4;

      if (invoice.totalPaid === 0 && paymentScenario === 0) {
        await feesService.recordOfflinePayment({
          studentId: student.id,
          amount: invoice.balance,
          paymentMethod: 'CASH',
          paidAt: '2026-10-01',
          note: 'SchoolRight test data: paid in full',
        }, recordedBy.id, schoolId);
        invoice = await feesService.getInvoice(student.id, sessionId, termId, schoolId);
      } else if (invoice.totalPaid === 0 && paymentScenario === 1) {
        await feesService.recordOfflinePayment({
          studentId: student.id,
          amount: Math.max(1, Math.floor(invoice.totalAmount / 2)),
          paymentMethod: 'CASH',
          paidAt: '2026-10-02',
          note: 'SchoolRight test data: partial payment',
        }, recordedBy.id, schoolId);
        invoice = await feesService.getInvoice(student.id, sessionId, termId, schoolId);
      }

      if (invoice.status === InvoiceStatus.PAID) counts.paid++;
      else if (invoice.status === InvoiceStatus.PARTIALLY_PAID) counts.partiallyPaid++;
      else counts.unpaid++;
    }
  }

  return counts;
};
