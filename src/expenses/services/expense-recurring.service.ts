import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringExpense, ExpenseCategory } from '../entities';
import {
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from '../dto';
import { RecurringFrequency } from '../enums';

@Injectable()
export class ExpenseRecurringService {
  constructor(
    @InjectRepository(RecurringExpense)
    private readonly recurringRepo: Repository<RecurringExpense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
  ) {}

  getRecurringExpenses = async (
    schoolId: string,
  ): Promise<RecurringExpense[]> => {
    return this.recurringRepo.find({
      where: { schoolId },
      relations: ['category', 'vendor'],
      order: { nextDueDate: 'ASC' },
    });
  };

  createRecurringExpense = async (
    input: CreateRecurringExpenseInput,
    schoolId: string,
  ): Promise<RecurringExpense> => {
    const category = await this.categoryRepo.findOne({
      where: { id: input.categoryId, schoolId },
    });
    if (!category) throw new NotFoundException('Selected category not found');

    const recurring = this.recurringRepo.create({
      schoolId,
      title: input.title.trim(),
      categoryId: input.categoryId,
      estimatedAmount: input.estimatedAmount,
      frequency: input.frequency,
      nextDueDate: input.nextDueDate,
      vendorId: input.vendorId,
      notes: input.notes?.trim(),
      isActive: true,
    });

    return this.recurringRepo.save(recurring);
  };

  updateRecurringExpense = async (
    input: UpdateRecurringExpenseInput,
    schoolId: string,
  ): Promise<RecurringExpense> => {
    const recurring = await this.recurringRepo.findOne({
      where: { id: input.id, schoolId },
    });
    if (!recurring) throw new NotFoundException('Recurring expense not found');

    if (input.title !== undefined) recurring.title = input.title.trim();
    if (input.categoryId !== undefined) recurring.categoryId = input.categoryId;
    if (input.estimatedAmount !== undefined)
      recurring.estimatedAmount = input.estimatedAmount;
    if (input.frequency !== undefined) recurring.frequency = input.frequency;
    if (input.nextDueDate !== undefined)
      recurring.nextDueDate = input.nextDueDate;
    if (input.vendorId !== undefined) recurring.vendorId = input.vendorId;
    if (input.notes !== undefined) recurring.notes = input.notes.trim();
    if (input.isActive !== undefined) recurring.isActive = input.isActive;

    return this.recurringRepo.save(recurring);
  };

  markRecorded = async (
    id: string,
    schoolId: string,
  ): Promise<RecurringExpense> => {
    const recurring = await this.recurringRepo.findOne({
      where: { id, schoolId },
    });
    if (!recurring) throw new NotFoundException('Recurring expense not found');

    recurring.lastRecordedDate = new Date().toISOString().slice(0, 10);

    // Advance nextDueDate based on frequency
    const currentDue = new Date(`${recurring.nextDueDate}T00:00:00.000Z`);
    if (recurring.frequency === RecurringFrequency.WEEKLY) {
      currentDue.setUTCDate(currentDue.getUTCDate() + 7);
    } else if (recurring.frequency === RecurringFrequency.MONTHLY) {
      currentDue.setUTCMonth(currentDue.getUTCMonth() + 1);
    } else if (recurring.frequency === RecurringFrequency.TERMLY) {
      currentDue.setUTCMonth(currentDue.getUTCMonth() + 3);
    } else if (recurring.frequency === RecurringFrequency.ANNUAL) {
      currentDue.setUTCFullYear(currentDue.getUTCFullYear() + 1);
    }
    recurring.nextDueDate = currentDue.toISOString().slice(0, 10);

    return this.recurringRepo.save(recurring);
  };
}
