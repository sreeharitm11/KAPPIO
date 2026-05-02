import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { FinanceService } from './finance.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  summary() {
    return this.financeService.getFinanceSummary();
  }

  @Get('expenses')
  expenses(@Query() query: FinanceQueryDto) {
    return this.financeService.listExpenses(query);
  }

  @Post('expenses')
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    return this.financeService.createExpense(dto, user);
  }

  @Get('cashbook')
  cashbook(@Query() query: FinanceQueryDto) {
    return this.financeService.listCashbook(query);
  }
}
