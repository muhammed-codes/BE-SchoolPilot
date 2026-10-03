import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseVendor, Expense } from '../entities';
import { CreateExpenseVendorInput, UpdateExpenseVendorInput } from '../dto';

@Injectable()
export class ExpenseVendorsService {
  constructor(
    @InjectRepository(ExpenseVendor)
    private readonly vendorRepo: Repository<ExpenseVendor>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  getVendors = async (schoolId: string): Promise<ExpenseVendor[]> => {
    return this.vendorRepo.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });
  };

  createVendor = async (
    input: CreateExpenseVendorInput,
    schoolId: string,
  ): Promise<ExpenseVendor> => {
    const existing = await this.vendorRepo.findOne({
      where: { schoolId, name: input.name.trim() },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        if (input.contactPerson)
          existing.contactPerson = input.contactPerson.trim();
        if (input.phone) existing.phone = input.phone.trim();
        if (input.email) existing.email = input.email.trim();
        if (input.address) existing.address = input.address.trim();
        if (input.notes) existing.notes = input.notes.trim();
        return this.vendorRepo.save(existing);
      }
      throw new BadRequestException(`Vendor "${input.name}" already exists`);
    }

    const vendor = this.vendorRepo.create({
      schoolId,
      name: input.name.trim(),
      contactPerson: input.contactPerson?.trim(),
      phone: input.phone?.trim(),
      email: input.email?.trim(),
      address: input.address?.trim(),
      notes: input.notes?.trim(),
      isActive: true,
    });
    return this.vendorRepo.save(vendor);
  };

  updateVendor = async (
    input: UpdateExpenseVendorInput,
    schoolId: string,
  ): Promise<ExpenseVendor> => {
    const vendor = await this.vendorRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (input.name !== undefined) vendor.name = input.name.trim();
    if (input.contactPerson !== undefined)
      vendor.contactPerson = input.contactPerson.trim();
    if (input.phone !== undefined) vendor.phone = input.phone.trim();
    if (input.email !== undefined) vendor.email = input.email.trim();
    if (input.address !== undefined) vendor.address = input.address.trim();
    if (input.notes !== undefined) vendor.notes = input.notes.trim();
    if (input.isActive !== undefined) vendor.isActive = input.isActive;

    return this.vendorRepo.save(vendor);
  };

  getVendorTotalSpend = async (
    vendorId: string,
    schoolId: string,
  ): Promise<number> => {
    const result = await this.expenseRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .where('e.schoolId = :schoolId', { schoolId })
      .andWhere('e.vendorId = :vendorId', { vendorId })
      .andWhere('e.isVoided = false')
      .getRawOne<{ total: string | null }>();

    return parseFloat(result?.total || '0');
  };
}
