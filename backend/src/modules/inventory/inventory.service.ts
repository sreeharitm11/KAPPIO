import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
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
    // 1. Create Categories
    const catRepo = this.dataSource.getRepository(Category);
    const cats = [
      { name: 'Artisan Coffee', description: 'Freshly roasted small-batch brews' },
      { name: 'Fresh Bites', description: 'Handcrafted snacks and pastries' },
      { name: 'Refreshments', description: 'Cool drinks and blends' },
    ];
    const savedCats: Record<string, Category> = {};
    for (const c of cats) {
      let existing = await catRepo.findOne({ where: { name: c.name } });
      if (!existing) existing = await catRepo.save(catRepo.create(c));
      savedCats[c.name] = existing;
    }

    // 2. Create Ingredients
    const rawMaterials = [
      { name: 'Coffee Beans', unit: 'gm', currentStock: '5000', lowStockThreshold: '1000' },
      { name: 'Whole Milk', unit: 'ml', currentStock: '10000', lowStockThreshold: '2000' },
      { name: 'Chocolate Sauce', unit: 'ml', currentStock: '2000', lowStockThreshold: '500' },
      { name: 'Flour', unit: 'gm', currentStock: '10000', lowStockThreshold: '2000' },
      { name: 'Butter', unit: 'gm', currentStock: '5000', lowStockThreshold: '1000' },
    ];
    const savedIngs: Record<string, Ingredient> = {};
    for (const r of rawMaterials) {
      let existing = await this.ingredientRepo.findOne({ where: { name: r.name } });
      if (!existing) existing = await this.ingredientRepo.save(this.ingredientRepo.create(r));
      savedIngs[r.name] = existing;
    }

    // 3. Create Menu Items
    const menuRepo = this.dataSource.getRepository(MenuItem);
    const items = [
      { 
        name: 'Double Espresso', 
        description: 'Rich and intense classic shot', 
        price: '180.00', 
        categoryId: savedCats['Artisan Coffee'].id,
        imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400',
        mappings: [{ name: 'Coffee Beans', qty: '18' }]
      },
      { 
        name: 'Classic Latte', 
        description: 'Creamy milk poured over espresso', 
        price: '240.00', 
        categoryId: savedCats['Artisan Coffee'].id,
        imageUrl: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=400',
        mappings: [{ name: 'Coffee Beans', qty: '18' }, { name: 'Whole Milk', qty: '200' }]
      },
      { 
        name: 'Butter Croissant', 
        description: 'Flaky, buttery French pastry', 
        price: '120.00', 
        categoryId: savedCats['Fresh Bites'].id,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
        mappings: [{ name: 'Flour', qty: '50' }, { name: 'Butter', qty: '30' }]
      },
    ];

    let itemsCreated = 0;
    for (const i of items) {
      let item = await menuRepo.findOne({ where: { name: i.name } });
      if (!item) {
        const { mappings: itemMappings, ...itemData } = i;
        item = await menuRepo.save(menuRepo.create(itemData));
        itemsCreated++;
        
        for (const m of itemMappings) {
          await this.mappingRepo.save(this.mappingRepo.create({
            menuItemId: item.id,
            ingredientId: savedIngs[m.name].id,
            quantityNeeded: m.qty
          }));
        }
      }
    }

    return `System Seeded: ${itemsCreated} new menu items created with inventory mappings.`;
  }

  async findAllIngredients() {
    return this.ingredientRepo.find({ order: { name: 'ASC' } });
  }

  async createIngredient(data: Partial<Ingredient>) {
    const ingredient = this.ingredientRepo.create(data);
    const saved = await this.ingredientRepo.save(ingredient);
    
    // Initial stock log
    await this.logRepo.save(this.logRepo.create({
      ingredientId: saved.id,
      changeAmount: saved.currentStock,
      type: InventoryLogType.MANUAL_ADJUSTMENT,
      remarks: 'Initial stock on creation',
    }));
    
    return saved;
  }


  async getLogs(ingredientId: string) {
    return this.logRepo.find({
      where: { ingredientId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
