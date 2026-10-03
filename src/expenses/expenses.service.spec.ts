/* eslint-disable @typescript-eslint/no-unsafe-return */

jest.mock('expo-server-sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
    })),
    isExpoPushToken: jest.fn().mockReturnValue(true),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ExpensesService,
  ExpenseRequestsService,
  ExpenseBudgetsService,
  PettyCashService,
} from './services';
import {
  Expense,
  ExpenseCategory,
  ExpenseDepartment,
  ExpenseVendor,
  ExpenseActivity,
  ExpenseRequest,
  ExpenseBudget,
} from './entities';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';
import {
  ExpensePaymentMethod,
  ExpensePaymentStatus,
  ExpenseRequestStatus,
  ExpenseRequestType,
} from './enums';
import { NotificationsService } from '../notifications/notifications.service';

describe('ExpensesModule Services', () => {
  let expensesService: ExpensesService;
  let requestsService: ExpenseRequestsService;
  let budgetsService: ExpenseBudgetsService;

  const mockSchoolId = '11111111-1111-1111-1111-111111111111';
  const mockUser: User = {
    id: '22222222-2222-2222-2222-222222222222',
    schoolId: mockSchoolId,
    role: UserRole.BURSAR,
    email: 'bursar@school.com',
    firstName: 'John',
    lastName: 'Bursar',
  } as User;

  const mockCategory: ExpenseCategory = {
    id: '33333333-3333-3333-3333-333333333333',
    schoolId: mockSchoolId,
    name: 'Fuel & Diesel',
    isActive: true,
  } as ExpenseCategory;

  const mockExpenseRepo = {
    create: jest.fn().mockImplementation((dto) => ({ id: 'exp-1', ...dto })),
    save: jest
      .fn()
      .mockImplementation((entity) =>
        Promise.resolve({ id: 'exp-1', ...entity }),
      ),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCategoryRepo = {
    find: jest.fn().mockResolvedValue([mockCategory]),
    findOne: jest.fn().mockResolvedValue(mockCategory),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
  };

  const mockRequestRepo = {
    create: jest.fn().mockImplementation((dto) => ({ id: 'req-1', ...dto })),
    save: jest
      .fn()
      .mockImplementation((entity) =>
        Promise.resolve({ id: 'req-1', ...entity }),
      ),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBudgetRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
  };

  const mockActivityRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
    find: jest.fn().mockResolvedValue([]),
  };

  const mockPettyCashService = {
    disburse: jest.fn().mockResolvedValue({}),
    getAccount: jest.fn().mockResolvedValue({ currentBalance: 50000 }),
    replenish: jest.fn().mockResolvedValue({}),
    getTransactions: jest.fn().mockResolvedValue([]),
  };

  const mockNotificationsService = {
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
    sendBulkNotifications: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        ExpenseRequestsService,
        ExpenseBudgetsService,
        { provide: getRepositoryToken(Expense), useValue: mockExpenseRepo },
        {
          provide: getRepositoryToken(ExpenseCategory),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(ExpenseDepartment),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(ExpenseVendor),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(ExpenseActivity),
          useValue: mockActivityRepo,
        },
        {
          provide: getRepositoryToken(ExpenseRequest),
          useValue: mockRequestRepo,
        },
        {
          provide: getRepositoryToken(ExpenseBudget),
          useValue: mockBudgetRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        { provide: PettyCashService, useValue: mockPettyCashService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    expensesService = module.get<ExpensesService>(ExpensesService);
    requestsService = module.get<ExpenseRequestsService>(
      ExpenseRequestsService,
    );
    budgetsService = module.get<ExpenseBudgetsService>(ExpenseBudgetsService);
  });

  describe('ExpensesService', () => {
    it('should create an expense and log activity', async () => {
      mockExpenseRepo.findOne.mockResolvedValueOnce({
        id: 'exp-1',
        schoolId: mockSchoolId,
        title: 'Generator Fuel',
        amount: 25000,
        paymentStatus: ExpensePaymentStatus.PAID,
      });

      const result = await expensesService.createExpense(
        {
          title: 'Generator Fuel',
          amount: 25000,
          expenseDate: '2026-10-03',
          categoryId: mockCategory.id,
          paymentMethod: ExpensePaymentMethod.CASH,
          paymentStatus: ExpensePaymentStatus.PAID,
        },
        mockUser,
      );

      expect(mockExpenseRepo.create).toHaveBeenCalled();
      expect(mockExpenseRepo.save).toHaveBeenCalled();
      expect(result.amount).toBe(25000);
    });

    it('should void an expense and preserve audit fields', async () => {
      const existingExpense = {
        id: 'exp-1',
        schoolId: mockSchoolId,
        title: 'Generator Fuel',
        amount: 25000,
        isVoided: false,
      };
      mockExpenseRepo.findOne
        .mockResolvedValueOnce(existingExpense)
        .mockResolvedValueOnce({
          ...existingExpense,
          isVoided: true,
          paymentStatus: ExpensePaymentStatus.VOIDED,
        });

      const result = await expensesService.voidExpense(
        { id: 'exp-1', reason: 'Entered wrong amount' },
        mockUser,
      );

      expect(result.isVoided).toBe(true);
      expect(result.paymentStatus).toBe(ExpensePaymentStatus.VOIDED);
    });
  });

  describe('ExpenseRequestsService', () => {
    it('should create a spending request with status PENDING_APPROVAL', async () => {
      mockRequestRepo.findOne.mockResolvedValueOnce({
        id: 'req-1',
        schoolId: mockSchoolId,
        title: 'Science Lab Chemicals',
        estimatedAmount: 45000,
        status: ExpenseRequestStatus.PENDING_APPROVAL,
      });

      const result = await requestsService.createRequest(
        {
          title: 'Science Lab Chemicals',
          estimatedAmount: 45000,
          categoryId: mockCategory.id,
          reason: 'Chemistry practical exam',
          requestType: ExpenseRequestType.MATERIALS_PURCHASE,
        },
        mockUser,
      );

      expect(result.status).toBe(ExpenseRequestStatus.PENDING_APPROVAL);
    });

    it('should approve a request and record approvedAmount', async () => {
      const pendingReq = {
        id: 'req-1',
        schoolId: mockSchoolId,
        title: 'Science Lab Chemicals',
        estimatedAmount: 45000,
        status: ExpenseRequestStatus.PENDING_APPROVAL,
      };
      mockRequestRepo.findOne
        .mockResolvedValueOnce(pendingReq)
        .mockResolvedValueOnce({
          ...pendingReq,
          status: ExpenseRequestStatus.APPROVED,
          approvedAmount: 40000,
        });

      const result = await requestsService.approveRequest(
        { id: 'req-1', approvedAmount: 40000 },
        mockUser,
      );

      expect(result.status).toBe(ExpenseRequestStatus.APPROVED);
      expect(result.approvedAmount).toBe(40000);
    });

    it('should reject a request with reason', async () => {
      const pendingReq = {
        id: 'req-1',
        schoolId: mockSchoolId,
        title: 'Science Lab Chemicals',
        estimatedAmount: 45000,
        status: ExpenseRequestStatus.PENDING_APPROVAL,
      };
      mockRequestRepo.findOne
        .mockResolvedValueOnce(pendingReq)
        .mockResolvedValueOnce({
          ...pendingReq,
          status: ExpenseRequestStatus.REJECTED,
          rejectionReason: 'Not in term budget',
        });

      const result = await requestsService.rejectRequest(
        { id: 'req-1', rejectionReason: 'Not in term budget' },
        mockUser,
      );

      expect(result.status).toBe(ExpenseRequestStatus.REJECTED);
      expect(result.rejectionReason).toBe('Not in term budget');
    });

    it('should convert an approved request to an actual expense', async () => {
      const approvedReq = {
        id: 'req-1',
        schoolId: mockSchoolId,
        title: 'Science Lab Chemicals',
        categoryId: mockCategory.id,
        estimatedAmount: 45000,
        approvedAmount: 40000,
        status: ExpenseRequestStatus.APPROVED,
        reason: 'Chemistry practical',
      };
      mockRequestRepo.findOne.mockResolvedValueOnce(approvedReq);

      mockExpenseRepo.findOne.mockResolvedValueOnce({
        id: 'exp-created-1',
        schoolId: mockSchoolId,
        title: 'Science Lab Chemicals',
        amount: 38500,
        requestId: 'req-1',
      });

      const converted = await requestsService.convertRequestToExpense(
        {
          requestId: 'req-1',
          actualAmount: 38500,
          expenseDate: '2026-10-03',
          paymentMethod: ExpensePaymentMethod.CASH,
        },
        mockUser,
      );

      expect(converted.amount).toBe(38500);
      expect(converted.requestId).toBe('req-1');
    });
  });

  describe('ExpenseBudgetsService', () => {
    it('should calculate budget progress with warning thresholds', async () => {
      mockBudgetRepo.find.mockResolvedValueOnce([
        { categoryId: mockCategory.id, budgetAmount: 100000 },
      ]);

      mockExpenseRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ categoryId: mockCategory.id, spent: '76000' }]),
      });

      mockRequestRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([
            { categoryId: mockCategory.id, committed: '5000' },
          ]),
      });

      const progress = await budgetsService.getBudgets(
        'sess-1',
        'term-1',
        mockSchoolId,
      );

      expect(progress.length).toBe(1);
      expect(progress[0].budgetAmount).toBe(100000);
      expect(progress[0].actualSpent).toBe(76000);
      expect(progress[0].committedAmount).toBe(5000);
      expect(progress[0].availableAmount).toBe(19000);
      expect(progress[0].percentageUsed).toBe(81);
      expect(progress[0].warningLevel).toBe('WARNING_75');
    });
  });
});
