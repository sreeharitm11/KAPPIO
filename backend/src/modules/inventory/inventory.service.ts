import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ingredient } from '../../database/entities/ingredient.entity';
import { MenuItemIngredient } from '../../database/entities/menu-item-ingredient.entity';
import { InventoryLog, InventoryLogType } from '../../database/entities/inventory-log.entity';
import { Order } from '../../database/entities/order.entity';
import { MenuItem } from '../../database/entities/menu-item.entity';
import { toMoneyNumber, toMoneyString } from '../../common/utils/money.util';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    @InjectRepository(MenuItemIngredient)
    private readonly mappingRepo: Repository<MenuItemIngredient>,
    @InjectRepository(InventoryLog)
    private readonly logRepo: Repository<InventoryLog>,
    private readonly dataSource: DataSource,
  ) {}

  async deductStockForOrder(order: Order) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        const mappings = await this.mappingRepo.find({
          where: { menuItemId: item.menuItemId },
          relations: ['ingredient'],
        });

        for (const mapping of mappings) {
          const qtyToDeduct = toMoneyNumber(mapping.quantityNeeded) * item.quantity;
          const ingredient = await queryRunner.manager.findOne(Ingredient, {
            where: { id: mapping.ingredientId },
            lock: { mode: 'pessimistic_write' },
          });

          if (ingredient) {
            const oldStock = toMoneyNumber(ingredient.currentStock);
            const newStock = oldStock - qtyToDeduct;
            ingredient.currentStock = toMoneyString(newStock);
            await queryRunner.manager.save(ingredient);

            await queryRunner.manager.save(
              this.logRepo.create({
                ingredientId: ingredient.id,
                changeAmount: toMoneyString(-qtyToDeduct),
                balanceAfter: toMoneyString(newStock),
                type: InventoryLogType.AUTO_DEDUCTION,
                remarks: `Order ${order.orderNumber}`,
              }),
            );

            if (newStock <= toMoneyNumber(ingredient.lowStockThreshold)) {
              this.logger.warn(`LOW STOCK ALERT: ${ingredient.name} is at ${newStock}${ingredient.unit}`);
              // In a real app, emit a socket event or send an email/SMS here
            }
          }
        }
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to deduct stock for order ${order.orderNumber}`, err);
    } finally {
      await queryRunner.release();
    }
  }

  async updateStock(id: string, amount: number, type: InventoryLogType, remarks?: string): Promise<Ingredient> {
    return await this.dataSource.transaction(async (manager) => {
      const ingredient = await manager.findOne(Ingredient, { where: { id } });
      if (!ingredient) throw new NotFoundException('Ingredient not found');

      const newStock = Number(ingredient.currentStock) + amount;
      ingredient.currentStock = newStock.toString();
      await manager.save(ingredient);

      await manager.save(InventoryLog, {
        ingredientId: id,
        changeAmount: amount.toString(),
        type,
        remarks,
      });

      return ingredient;
    });
  }

  async seedInventory(): Promise<string> {
    const rawMaterials = [
      { name: 'Coffee Beans', unit: 'gm', currentStock: '5000', lowStockThreshold: '1000' },
      { name: 'Milk', unit: 'ml', currentStock: '10000', lowStockThreshold: '2000' },
      { name: 'Sugar', unit: 'gm', currentStock: '2000', lowStockThreshold: '500' },
      { name: 'Chicken Breast', unit: 'gm', currentStock: '3000', lowStockThreshold: '1000' },
      { name: 'Burger Buns', unit: 'pcs', currentStock: '50', lowStockThreshold: '10' },
      { name: 'Cheese Slices', unit: 'pcs', currentStock: '100', lowStockThreshold: '20' },
      { name: 'Avocado', unit: 'pcs', currentStock: '20', lowStockThreshold: '5' },
      { name: 'Potato (Fries)', unit: 'gm', currentStock: '10000', lowStockThreshold: '2000' },
    ];

    const savedIngredients: Record<string, Ingredient> = {};
    for (const raw of rawMaterials) {
      let ing = await this.ingredientRepo.findOne({ where: { name: raw.name } });
      if (!ing) {
        ing = await this.ingredientRepo.save(this.ingredientRepo.create(raw));
      }
      savedIngredients[raw.name] = ing;
    }

    const menuItems = await this.dataSource.getRepository(MenuItem).find();
    let mappedCount = 0;

    for (const item of menuItems) {
      const name = item.name.toLowerCase();
      const mappings: any[] = [];

      if (name.includes('espresso')) {
        mappings.push({ ingredientId: savedIngredients['Coffee Beans'].id, quantityNeeded: '18' });
      } else if (name.includes('latte') || name.includes('cappuccino') || name.includes('coffee')) {
        mappings.push({ ingredientId: savedIngredients['Coffee Beans'].id, quantityNeeded: '18' });
        mappings.push({ ingredientId: savedIngredients['Milk'].id, quantityNeeded: '200' });
      } else if (name.includes('burger')) {
        mappings.push({ ingredientId: savedIngredients['Burger Buns'].id, quantityNeeded: '1' });
        mappings.push({ ingredientId: savedIngredients['Cheese Slices'].id, quantityNeeded: '1' });
        if (name.includes('chicken')) {
          mappings.push({ ingredientId: savedIngredients['Chicken Breast'].id, quantityNeeded: '150' });
        }
      } else if (name.includes('fries')) {
        mappings.push({ ingredientId: savedIngredients['Potato (Fries)'].id, quantityNeeded: '200' });
      } else if (name.includes('avocado')) {
        mappings.push({ ingredientId: savedIngredients['Avocado'].id, quantityNeeded: '0.5' });
      }

      for (const m of mappings) {
        const existing = await this.mappingRepo.findOne({ where: { menuItemId: item.id, ingredientId: m.ingredientId } });
        if (!existing) {
          await this.mappingRepo.save(this.mappingRepo.create({
            menuItemId: item.id,
            ...m
          }));
        }
      }
      if (mappings.length > 0) mappedCount++;
    }

    return `Inventory seeded. Mapped ${mappedCount} menu items.`;
  }

  async findAllIngredients() {
    return this.ingredientRepo.find({ order: { name: 'ASC' } });
  }

  async getLogs(ingredientId: string) {
    return this.logRepo.find({
      where: { ingredientId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
