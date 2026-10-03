import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Expense,
  ExpenseCategory,
  ExpenseDepartment,
  ExpenseVendor,
  ExpenseRequest,
  ExpenseBudget,
  RecurringExpense,
  PettyCashAccount,
  PettyCashTransaction,
  ExpenseActivity,
} from './entities';
import { User } from '../users/entities/user.entity';
import { Session } from '../terms/entities/session.entity';
import { Term } from '../terms/entities/term.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccessModule } from '../access/access.module';

import {
  ExpensesService,
  ExpenseRequestsService,
  ExpenseBudgetsService,
  ExpenseVendorsService,
  ExpenseRecurringService,
  PettyCashService,
  ExpenseReportsService,
} from './services';

import {
  ExpensesResolver,
  ExpenseRequestsResolver,
  ExpenseBudgetsResolver,
  ExpenseVendorsResolver,
  ExpenseRecurringResolver,
  PettyCashResolver,
  ExpenseReportsResolver,
} from './resolvers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      ExpenseCategory,
      ExpenseDepartment,
      ExpenseVendor,
      ExpenseRequest,
      ExpenseBudget,
      RecurringExpense,
      PettyCashAccount,
      PettyCashTransaction,
      ExpenseActivity,
      User,
      Session,
      Term,
    ]),
    NotificationsModule,
    AccessModule,
  ],
  providers: [
    ExpensesService,
    ExpenseRequestsService,
    ExpenseBudgetsService,
    ExpenseVendorsService,
    ExpenseRecurringService,
    PettyCashService,
    ExpenseReportsService,
    ExpensesResolver,
    ExpenseRequestsResolver,
    ExpenseBudgetsResolver,
    ExpenseVendorsResolver,
    ExpenseRecurringResolver,
    PettyCashResolver,
    ExpenseReportsResolver,
  ],
  exports: [
    ExpensesService,
    ExpenseRequestsService,
    ExpenseBudgetsService,
    PettyCashService,
  ],
})
export class ExpensesModule {}
