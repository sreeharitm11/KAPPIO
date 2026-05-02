import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { CollectCodPaymentDto } from './dto/collect-cod-payment.dto';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.DELIVERY)
  @Patch('orders/:orderId/cod/collect')
  collectCod(
    @Param('orderId') orderId: string,
    @Body() dto: CollectCodPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.collectCod(orderId, dto, user);
  }
}
