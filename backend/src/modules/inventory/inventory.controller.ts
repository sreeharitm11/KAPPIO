import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { InventoryLogType } from '../../database/entities/inventory-log.entity';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.inventoryService.findAllIngredients();
  }

  @Patch('ingredients/:id/stock')
  @Roles(UserRole.ADMIN)
  async updateStock(
    @Param('id') id: string,
    @Body() body: { amount: number; remarks?: string },
  ) {
    return this.inventoryService.updateStock(id, body.amount, InventoryLogType.MANUAL_ADJUSTMENT, body.remarks);
  }

  @Post('seed')
  @Roles(UserRole.ADMIN)
  async seed() {
    return this.inventoryService.seedInventory();
  }

  @Get('ingredients/:id/logs')
  @Roles(UserRole.ADMIN)
  async getLogs(@Param('id') id: string) {
    return this.inventoryService.getLogs(id);
  }
}
