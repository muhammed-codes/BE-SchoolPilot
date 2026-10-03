import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PettyCashAccount, PettyCashTransaction } from '../entities';
import { ReplenishPettyCashInput } from '../dto';
import { PettyCashTransactionType } from '../enums';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PettyCashService {
  private readonly logger = new Logger(PettyCashService.name);

  constructor(
    @InjectRepository(PettyCashAccount)
    private readonly accountRepo: Repository<PettyCashAccount>,
    @InjectRepository(PettyCashTransaction)
    private readonly transactionRepo: Repository<PettyCashTransaction>,
  ) {}

  getAccount = async (schoolId: string): Promise<PettyCashAccount> => {
    let account = await this.accountRepo.findOne({
      where: { schoolId },
    });

    if (!account) {
      account = this.accountRepo.create({
        schoolId,
        name: 'Main Petty Cash',
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
      });
      account = await this.accountRepo.save(account);
    }

    return account;
  };

  replenish = async (
    input: ReplenishPettyCashInput,
    user: User,
  ): Promise<PettyCashTransaction> => {
    const schoolId = user.schoolId;
    if (!schoolId)
      throw new BadRequestException('User must belong to a school');

    const account = await this.getAccount(schoolId);
    const amount = Number(input.amount);
    if (amount <= 0) {
      throw new BadRequestException(
        'Replenishment amount must be greater than 0',
      );
    }

    const currentBal = Number(account.currentBalance || 0);
    const newBal = currentBal + amount;
    account.currentBalance = newBal;
    await this.accountRepo.save(account);

    const tx = this.transactionRepo.create({
      schoolId,
      accountId: account.id,
      type: PettyCashTransactionType.REPLENISHMENT,
      amount,
      balanceAfter: newBal,
      description: input.description.trim(),
      referenceId: input.referenceId?.trim(),
      recordedById: user.id,
    });

    return this.transactionRepo.save(tx);
  };

  disburse = async (
    amount: number,
    description: string,
    referenceId: string | undefined,
    user: User,
  ): Promise<PettyCashTransaction> => {
    const schoolId = user.schoolId;
    if (!schoolId)
      throw new BadRequestException('User must belong to a school');

    const account = await this.getAccount(schoolId);
    const currentBal = Number(account.currentBalance || 0);
    const newBal = currentBal - amount; // allowed to track even if negative with warning
    account.currentBalance = newBal;
    await this.accountRepo.save(account);

    const tx = this.transactionRepo.create({
      schoolId,
      accountId: account.id,
      type: PettyCashTransactionType.DISBURSEMENT,
      amount,
      balanceAfter: newBal,
      description,
      referenceId,
      recordedById: user.id,
    });

    return this.transactionRepo.save(tx);
  };

  getTransactions = async (
    schoolId: string,
    limit = 50,
  ): Promise<PettyCashTransaction[]> => {
    return this.transactionRepo.find({
      where: { schoolId },
      relations: ['recordedBy'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  };
}
