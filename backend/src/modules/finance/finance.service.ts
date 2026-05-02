import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CashbookEntryType } from '../../common/enums/cashbook-entry-type.enum';
import { ExpenseType } from '../../common/enums/expense-type.enum';
import { CashbookEntry } from '../../database/entities/cashbook-entry.entity';
import { Expense } from '../../database/entities/expense.entity';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';
import { addMoney, toMoneyNumber, toMoneyString } from '../../common/utils/money.util';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { FinanceQueryDto } from './dto/finance-query.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(CashbookEntry)
    private readonly cashbookRepository: Repository<CashbookEntry>,
  ) {}

  async createExpense(dto: CreateExpenseDto, actor?: AuthUser) {
    const expense = await this.expensesRepository.save(
      this.expensesRepository.create({
        ...dto,
        amount: toMoneyString(dto.amount),
        createdById: actor?.sub ?? null,
      }),
    );

    const currentBalance = await this.getCurrentBalance();
    await this.cashbookRepository.save(
      this.cashbookRepository.create({
        date: dto.date,
        type: CashbookEntryType.DEBIT,
        description: dto.description,
        amount: toMoneyString(dto.amount),
        balance: toMoneyString(currentBalance - dto.amount),
        referenceType: 'EXPENSE',
        referenceId: expense.id,
      }),
    );

    return expense;
  }

  async listExpenses(query: FinanceQueryDto): Promise<PaginatedResponse<Expense>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Record<string, unknown> = {};

    if (query.type) {
      where.type = query.type;
    }
    if (query.fromDate && query.toDate) {
      where.date = Between(query.fromDate, query.toDate);
    } else if (query.fromDate) {
      where.date = MoreThanOrEqual(query.fromDate);
    } else if (query.toDate) {
      where.date = LessThanOrEqual(query.toDate);
    }

    const [items, total] = await this.expensesRepository.findAndCount({
      where,
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listCashbook(query: FinanceQueryDto): Promise<PaginatedResponse<CashbookEntry>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [items, total] = await this.cashbookRepository.findAndCount({
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFinanceSummary() {
    const [direct, indirect, balance] = await Promise.all([
      this.expensesRepository
        .createQueryBuilder('expense')
        .select('SUM(CAST(expense.amount AS NUMERIC))', 'sum')
        .where('expense.type = :type', { type: ExpenseType.DIRECT })
        .getRawOne()
        .then((result) => Number(result?.sum ?? 0)),
      this.expensesRepository
        .createQueryBuilder('expense')
        .select('SUM(CAST(expense.amount AS NUMERIC))', 'sum')
        .where('expense.type = :type', { type: ExpenseType.INDIRECT })
        .getRawOne()
        .then((result) => Number(result?.sum ?? 0)),
      this.getCurrentBalance(),
    ]);

    return {
      directExpenses: direct,
      indirectExpenses: indirect,
      currentCashBalance: balance,
    };
  }

  async createCreditEntry(params: {
    amount: number;
    date: string;
    description: string;
    referenceId: string;
    referenceType: string;
  }) {
    const balance = await this.getCurrentBalance();
    return this.cashbookRepository.save(
      this.cashbookRepository.create({
        date: params.date,
        type: CashbookEntryType.CREDIT,
        description: params.description,
        amount: toMoneyString(params.amount),
        balance: addMoney(balance, params.amount),
        referenceId: params.referenceId,
        referenceType: params.referenceType,
      }),
    );
  }

  private async getCurrentBalance(): Promise<number> {
    const latestEntry = await this.cashbookRepository.findOne({
      order: {
        createdAt: 'DESC',
      },
    });

    return latestEntry ? toMoneyNumber(latestEntry.balance) : 0;
  }
}
