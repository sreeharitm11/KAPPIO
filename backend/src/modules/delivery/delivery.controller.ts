import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { DeliveryService } from './delivery.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post('orders/:orderId/assign')
  assign(
    @Param('orderId') orderId: string,
    @Body() dto: AssignDeliveryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveryService.assign(orderId, dto, user);
  }

  @Roles(UserRole.DELIVERY)
  @Get('me/orders')
  myOrders(@CurrentUser() user: AuthUser) {
    return this.deliveryService.findAssignedOrders(user.sub);
  }

  @Roles(UserRole.DELIVERY, UserRole.ADMIN, UserRole.STAFF)
  @Patch('orders/:orderId/status')
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveryService.updateStatus(orderId, dto, user);
  }
}
