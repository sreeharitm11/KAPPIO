import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
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
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Deducts ingredients stock based on order items
   */
  async deductStockForOrder(order: Order, manager?: EntityManager) {
    this.logger.log(`Deducting stock for order: ${order.orderNumber}`);

    const ingredientRepo = manager ? manager.getRepository(Ingredient) : this.ingredientRepo;
    const mappingRepo = manager ? manager.getRepository(MenuItemIngredient) : this.mappingRepo;
    const logRepo = manager ? manager.getRepository(InventoryLog) : this.logRepo;

    for (const item of order.items) {
      // Find all ingredients linked to this menu item
      const mappings = await mappingRepo.find({
        where: { menuItemId: item.menuItemId },
        relations: ['ingredient'],
      });

      for (const mapping of mappings) {
        const quantityToDeduct = Number(mapping.quantityNeeded) * item.quantity;
        const ingredient = await ingredientRepo.findOne({ where: { id: mapping.ingredientId } });

        if (ingredient) {
          const oldStock = Number(ingredient.currentStock);
          const newStock = oldStock - quantityToDeduct;
          ingredient.currentStock = newStock.toString();
          
          await ingredientRepo.save(ingredient);

          // Log the automated deduction
          await logRepo.save(logRepo.create({
            ingredientId: ingredient.id,
            changeAmount: `-${quantityToDeduct}`,
            balanceAfter: newStock.toString(),
            type: InventoryLogType.AUTO_DEDUCTION,
            remarks: `Order ${order.orderNumber} - ${item.quantity}x ${item.menuItem?.name || 'Item'}`,
          }));
        }
      }
    }
  }

  async updateStock(
    ingredientId: string,
    amount: number,
    type: InventoryLogType = InventoryLogType.MANUAL_ADJUSTMENT,
    remarks?: string,
    manager?: EntityManager,
  ) {
    const ingredientRepo = manager ? manager.getRepository(Ingredient) : this.ingredientRepo;
    const logRepo = manager ? manager.getRepository(InventoryLog) : this.logRepo;

    const ingredient = await ingredientRepo.findOne({ where: { id: ingredientId } });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID ${ingredientId} not found`);
    }

    const oldStock = Number(ingredient.currentStock);
    const newStock = oldStock + amount;
    ingredient.currentStock = newStock.toString();

    const saved = await ingredientRepo.save(ingredient);

    await logRepo.save(
      logRepo.create({
        ingredientId: saved.id,
        changeAmount: amount.toString(),
        balanceAfter: newStock.toString(),
        type,
        remarks: remarks || 'Stock updated',
      }),
    );

    return saved;
  }

  async seedInventory(): Promise<string> {
    const catRepo = this.dataSource.getRepository(Category);
    const menuRepo = this.dataSource.getRepository(MenuItem);

    const rawData = [
      // Appetizers
      { name: 'French Fries (M)', cat: 'Appetizers', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5' },
      { name: 'French Fries (L)', cat: 'Appetizers', price: '89.00', isVeg: true, img: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5' },
      { name: 'Chicken Fingers (M)', cat: 'Appetizers', price: '65.00', isVeg: false, img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086' },
      { name: 'Chicken Fingers (L)', cat: 'Appetizers', price: '99.00', isVeg: false, img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086' },
      { name: 'Chicken Nuggets (M)', cat: 'Appetizers', price: '65.00', isVeg: false, img: 'https://images.unsplash.com/photo-1604908177225-2f4c7f9c2c3c' },
      { name: 'Chicken Nuggets (L)', cat: 'Appetizers', price: '99.00', isVeg: false, img: 'https://images.unsplash.com/photo-1604908177225-2f4c7f9c2c3c' },
      { name: 'Crispy Strips (M)', cat: 'Appetizers', price: '89.00', isVeg: false, img: 'https://images.unsplash.com/photo-1562967914-01efa7c2c3f7' },
      { name: 'Crispy Strips (L)', cat: 'Appetizers', price: '125.00', isVeg: false, img: 'https://images.unsplash.com/photo-1562967914-01efa7c2c3f7' },
      { name: 'Loaded Fries (M)', cat: 'Appetizers', price: '99.00', isVeg: false, img: 'https://images.unsplash.com/photo-1561758033-7e924f619b48' },
      { name: 'Loaded Fries (L)', cat: 'Appetizers', price: '129.00', isVeg: false, img: 'https://images.unsplash.com/photo-1561758033-7e924f619b48' },
      { name: 'Peri Peri Strips (M)', cat: 'Appetizers', price: '95.00', isVeg: false, img: 'https://images.unsplash.com/photo-1562967914-608f82629710' },
      { name: 'Peri Peri Strips (L)', cat: 'Appetizers', price: '130.00', isVeg: false, img: 'https://images.unsplash.com/photo-1562967914-608f82629710' },

      // Fruit Salad
      { name: 'Classic Fruit Salad', cat: 'Fruit Salad', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb' },
      { name: 'Royal Fruit Salad', cat: 'Fruit Salad', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb' },

      // Avil Milk
      { name: 'Normal Avil Milk', cat: 'Avil Milk', price: '49.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024601-bec78aea7050' },
      { name: 'S.P Avil Milk', cat: 'Avil Milk', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024601-bec78aea7050' },
      { name: 'Fruit Mix Avil Milk', cat: 'Avil Milk', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704e' },
      { name: 'Dry Fruit Mix Avil Milk', cat: 'Avil Milk', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b' },
      { name: 'Fruit and Nut Avil Milk', cat: 'Avil Milk', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704d' },

      // Special Shakes
      { name: 'Mango Banana Shake', cat: 'Special Shakes', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc698' },
      { name: 'Avocado Mango Shake', cat: 'Special Shakes', price: '89.00', isVeg: true, img: 'https://images.unsplash.com/photo-1625944525533-473f1c0c8c36' },
      { name: 'Tender Avocado Shake', cat: 'Special Shakes', price: '89.00', isVeg: true, img: 'https://images.unsplash.com/photo-1625944525533-473f1c0c8c38' },
      { name: 'Tender Mango Shake', cat: 'Special Shakes', price: '89.00', isVeg: true, img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc697' },

      // Club Sandwich
      { name: 'Veg Sandwich', cat: 'Club Sandwich', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1585238342028-78d387f4a708' },
      { name: 'Egg Sandwich', cat: 'Club Sandwich', price: '79.00', isVeg: false, img: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92' },
      { name: 'Chicken Sandwich', cat: 'Club Sandwich', price: '89.00', isVeg: false, img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af' },
      { name: 'Chicken Crispy Sandwich', cat: 'Club Sandwich', price: '99.00', isVeg: false, img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba22d' },

      // Burger
      { name: 'Veg Burger', cat: 'Burger', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6' },
      { name: 'Egg Burger', cat: 'Burger', price: '69.00', isVeg: false, img: 'https://images.unsplash.com/photo-1550317138-10000687a72b' },
      { name: 'Spicy Veg Burger', cat: 'Burger', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1550317138-10000687a72c' },
      { name: 'Chicken Burger', cat: 'Burger', price: '79.00', isVeg: false, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349' },
      { name: 'Veg Cheese Burger', cat: 'Burger', price: '89.00', isVeg: true, img: 'https://images.unsplash.com/photo-1606755962773-7d3c8d8f3e2f' },
      { name: 'Hot Crispy Chick Burger', cat: 'Burger', price: '89.00', isVeg: false, img: 'https://images.unsplash.com/photo-1612392062798-2e6f8d6a1d28' },
      { name: 'Chicken Cheese Burger', cat: 'Burger', price: '99.00', isVeg: false, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' },
      { name: 'Crispy Chick Cheese Burger', cat: 'Burger', price: '109.00', isVeg: false, img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13088' },

      // Fried Chicken
      { name: 'Fried Chicken (Qtr)', cat: 'Fried Chicken', price: '150.00', isVeg: false, img: 'https://images.unsplash.com/photo-1562967914-01efa7c2c3f9' },
      { name: 'Fried Chicken (Half)', cat: 'Fried Chicken', price: '280.00', isVeg: false, img: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb' },
      { name: 'Fried Chicken (Full)', cat: 'Fried Chicken', price: '540.00', isVeg: false, img: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90' },

      // Healthy Shakes
      { name: 'Power Booster', cat: 'Healthy Shakes', price: '100.00', isVeg: true, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423' },
      { name: 'Vitamin Load', cat: 'Healthy Shakes', price: '120.00', isVeg: true, img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0d' },
      { name: 'Weight Loss', cat: 'Healthy Shakes', price: '90.00', isVeg: true, img: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c7' },
      { name: 'I Am The King', cat: 'Healthy Shakes', price: '110.00', isVeg: true, img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b' },

      // Fresh Juice
      { name: 'Watermelon Juice', cat: 'Fresh Juice', price: '39.00', isVeg: true, img: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c6' },
      { name: 'Grape Juice', cat: 'Fresh Juice', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba' },
      { name: 'Musambi Juice', cat: 'Fresh Juice', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859' },
      { name: 'Carrot Juice', cat: 'Fresh Juice', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c4' },
      { name: 'Pineapple Juice', cat: 'Fresh Juice', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1622597467836-f3e0c57cbd08' },
      { name: 'Orange Juice', cat: 'Fresh Juice', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602424' },

      // Lime
      { name: 'Fresh Lime', cat: 'Lime', price: '20.00', isVeg: true, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc' },
      { name: 'Mint Lime', cat: 'Lime', price: '25.00', isVeg: true, img: 'https://images.unsplash.com/photo-1590080877777-5c0c03d33e0c' },
      { name: 'Pineapple Lime', cat: 'Lime', price: '30.00', isVeg: true, img: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d' },
      { name: 'Orange Lime', cat: 'Lime', price: '30.00', isVeg: true, img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416442' },
      { name: 'Grape Lime', cat: 'Lime', price: '30.00', isVeg: true, img: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643f' },
      { name: 'Ginger Lime', cat: 'Lime', price: '30.00', isVeg: true, img: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643e' },

      // Juice & Shakes
      { name: 'Sharjah Shake', cat: 'Juice & Shakes', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024601-bec78aea7051' },
      { name: 'Shamam Shake', cat: 'Juice & Shakes', price: '59.00', isVeg: true, img: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c5' },
      { name: 'Chikoo Shake', cat: 'Juice & Shakes', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699' },
      { name: 'Mango Shake', cat: 'Juice & Shakes', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0c' },
      { name: 'Tender Shake', cat: 'Juice & Shakes', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24096' },
      { name: 'Strawberry Shake', cat: 'Juice & Shakes', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1577805947697-89e18249d768' },
      { name: 'Avocado Shake', cat: 'Juice & Shakes', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1625944525533-473f1c0c8c37' },
      { name: 'Apple Shake', cat: 'Juice & Shakes', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1571680322279-a226e6a4cc2a' },
      { name: 'Anar Shake', cat: 'Juice & Shakes', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423' },
      { name: 'Jackfruit Shake', cat: 'Juice & Shakes', price: '79.00', isVeg: true, img: 'https://images.unsplash.com/photo-1589308078055-eb8cfe3c1f6f' },

      // Hot Beverages
      { name: 'Tea', cat: 'Hot Beverages', price: '10.00', isVeg: true, img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574' },
      { name: 'Coffee', cat: 'Hot Beverages', price: '15.00', isVeg: true, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93' },
      { name: 'Boost', cat: 'Hot Beverages', price: '15.00', isVeg: true, img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092' },
      { name: 'Horlicks', cat: 'Hot Beverages', price: '15.00', isVeg: true, img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24094' },
      { name: 'Hot Badam', cat: 'Hot Beverages', price: '15.00', isVeg: true, img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24095' },

      // Sodas
      { name: 'Fresh Lime Soda', cat: 'Sodas', price: '20.00', isVeg: true, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bd' },
      { name: 'Chilli Soda', cat: 'Sodas', price: '30.00', isVeg: true, img: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d' },
      { name: 'Masala Soda', cat: 'Sodas', price: '30.00', isVeg: true, img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416440' },
      { name: 'Mint Lime Soda', cat: 'Sodas', price: '30.00', isVeg: true, img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416441' },
      { name: 'Soda Sarbath', cat: 'Sodas', price: '30.00', isVeg: true, img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416444' },

      // Mojito
      { name: 'Passion Fruit Mojito', cat: 'Mojito', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859' },
      { name: 'Sea Blue Mojito', cat: 'Mojito', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c' },
      { name: 'Strawberry Mojito', cat: 'Mojito', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976be' },
      { name: 'Lemon Mint Mojito', cat: 'Mojito', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1605270012917-bf157c5a9541' },
      { name: 'Green Apple Mojito', cat: 'Mojito', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024709-8f23befc6b2d' },
      { name: 'Watermelon Mojito', cat: 'Mojito', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796d' },
      { name: 'Orange Blossom Mojito', cat: 'Mojito', price: '69.00', isVeg: true, img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55' },

      // Falooda
      { name: 'Arctic Bay (Strawberry, Vanila)', cat: 'Falooda', price: '120.00', isVeg: true, img: 'https://images.unsplash.com/photo-1577805947697-89e18249d767' },
      { name: 'Choco Nut Falooda', cat: 'Falooda', price: '150.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b' },
      { name: 'Malabar Magic Falooda', cat: 'Falooda', price: '130.00', isVeg: true, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704f' },
      { name: 'Classic Falooda', cat: 'Falooda', price: '100.00', isVeg: true, img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24093' },
    ];

    const categoriesSet = new Set(rawData.map(i => i.cat));
    const savedCats: Record<string, Category> = {};
    for (const catName of Array.from(categoriesSet)) {
      let existing = await catRepo.findOne({ where: { name: catName } });
      if (!existing) existing = await catRepo.save(catRepo.create({ name: catName, description: `Our specialty ${catName} selection` }));
      savedCats[catName] = existing;
    }

    const baseIngs = [
      { name: 'Base Stock', unit: 'unit', currentStock: '9999', lowStockThreshold: '10' }
    ];
    const savedIngs: Record<string, Ingredient> = {};
    for (const b of baseIngs) {
      let existing = await this.ingredientRepo.findOne({ where: { name: b.name } });
      if (!existing) existing = await this.ingredientRepo.save(this.ingredientRepo.create(b));
      savedIngs[b.name] = existing;
    }

    let itemsCreated = 0;
    for (const i of rawData) {
      let item = await menuRepo.findOne({ where: { name: i.name } });
      if (!item) {
        item = await menuRepo.save(menuRepo.create({
          name: i.name,
          description: `Freshly prepared ${i.name} from our ${i.cat} collection.`,
          price: i.price,
          categoryId: savedCats[i.cat].id,
          imageUrl: i.img,
          isVeg: i.isVeg
        }));
        itemsCreated++;
        
        await this.mappingRepo.save(this.mappingRepo.create({
          menuItemId: item.id,
          ingredientId: savedIngs['Base Stock'].id,
          quantityNeeded: '1'
        }));
      } else {
        // Update existing items with new price and category if needed
        item.price = i.price;
        item.categoryId = savedCats[i.cat].id;
        item.isVeg = i.isVeg;
        await menuRepo.save(item);
      }
    }

    return `Menu Fully Seeded: ${itemsCreated} new items added across ${categoriesSet.size} categories.`;
  }

  async findAllIngredients() {
    return this.ingredientRepo.find({ order: { name: 'ASC' } });
  }

  async createIngredient(data: Partial<Ingredient>) {
    const ingredient = this.ingredientRepo.create(data);
    const saved = await this.ingredientRepo.save(ingredient);
    
    await this.logRepo.save(this.logRepo.create({
      ingredientId: saved.id,
      changeAmount: saved.currentStock,
      balanceAfter: saved.currentStock,
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
