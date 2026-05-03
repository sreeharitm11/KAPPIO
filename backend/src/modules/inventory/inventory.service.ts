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
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Deducts ingredients stock based on order items
   */
  async deductStockForOrder(order: Order) {
    this.logger.log(`Deducting stock for order: ${order.orderNumber}`);

    for (const item of order.items) {
      // Find all ingredients linked to this menu item
      const mappings = await this.mappingRepo.find({
        where: { menuItemId: item.menuItemId },
        relations: ['ingredient'],
      });

      for (const mapping of mappings) {
        const quantityToDeduct = Number(mapping.quantityNeeded) * item.quantity;
        const ingredient = await this.ingredientRepo.findOne({ where: { id: mapping.ingredientId } });

        if (ingredient) {
          const oldStock = Number(ingredient.currentStock);
          ingredient.currentStock = (oldStock - quantityToDeduct).toString();
          
          await this.ingredientRepo.save(ingredient);

          // Log the automated deduction
          await this.logRepo.save(this.logRepo.create({
            ingredientId: ingredient.id,
            changeAmount: `-${quantityToDeduct}`,
            type: InventoryLogType.AUTO_DEDUCTION,
            remarks: `Order ${order.orderNumber} - ${item.quantity}x ${item.menuItem?.name || 'Item'}`,
          }));
        }
      }
    }
  }

  async seedInventory(): Promise<string> {
    const catRepo = this.dataSource.getRepository(Category);
    const menuRepo = this.dataSource.getRepository(MenuItem);

    const rawData = [
      { name: 'Anar Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423' },
      { name: 'Apple Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1571680322279-a226e6a4cc2a' },
      { name: 'Arctic Bay (Strawberry, Vanilla)', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1577805947697-89e18249d767' },
      { name: 'Avocado Mango Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1625944525533-473f1c0c8c36' },
      { name: 'Avocado Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1625944525533-473f1c0c8c37' },
      { name: 'Boost', cat: 'Beverage', img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092' },
      { name: 'Carrot Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c4' },
      { name: 'Chicken Burger', cat: 'Burger', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349' },
      { name: 'Chicken Cheese Burger', cat: 'Burger', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' },
      { name: 'Chicken Crispy Sandwich', cat: 'Sandwich', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d' },
      { name: 'Chicken Fingers (L)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086' },
      { name: 'Chicken Fingers (M)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13087' },
      { name: 'Chicken Nuggets (L)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1604908177225-2f4c7f9c2c3c' },
      { name: 'Chicken Nuggets (M)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1604908177225-2f4c7f9c2c3d' },
      { name: 'Chicken Sandwich', cat: 'Sandwich', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af' },
      { name: 'Chikoo Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699' },
      { name: 'Chilli Soda', cat: 'Drink', img: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d' },
      { name: 'Choco Nut', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b' },
      { name: 'Classic Falooda', cat: 'Dessert', img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24093' },
      { name: 'Classic Fruit Salad', cat: 'Dessert', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb' },
      { name: 'Coffee', cat: 'Beverage', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93' },
      { name: 'Combo Burger Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1550547660-4d5d3a3e2c7f' },
      { name: 'Combo Nuggets Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1561758033-7e924f619b47' },
      { name: 'Crispy Chick Cheese Burger', cat: 'Burger', img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13088' },
      { name: 'Crispy Strips (L)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1562967914-01efa7c2c3f7' },
      { name: 'Crispy Strips (M)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1562967914-01efa7c2c3f8' },
      { name: 'Dry Fruit Mix Avil Milk', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b' },
      { name: 'Egg Burger', cat: 'Burger', img: 'https://images.unsplash.com/photo-1550317138-10000687a72b' },
      { name: 'Egg Sandwich', cat: 'Sandwich', img: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92' },
      { name: 'French Fries (L)', cat: 'Snacks', img: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5' },
      { name: 'French Fries (M)', cat: 'Snacks', img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f' },
      { name: 'Fresh Lime', cat: 'Drink', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc' },
      { name: 'Fresh Lime Soda', cat: 'Drink', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bd' },
      { name: 'Fried Chicken (Full)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90' },
      { name: 'Fried Chicken (Half)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb' },
      { name: 'Fried Chicken (Qtr)', cat: 'Chicken', img: 'https://images.unsplash.com/photo-1562967914-01efa7c2c3f9' },
      { name: 'Fruit and Nut Avil Milk', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704d' },
      { name: 'Fruit Mix Avil Milk', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704e' },
      { name: 'Ginger Lime', cat: 'Drink', img: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643e' },
      { name: 'Grape Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba' },
      { name: 'Grape Lime', cat: 'Drink', img: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643f' },
      { name: 'Green Apple Mojito', cat: 'Mojito', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6b2d' },
      { name: 'Horlicks', cat: 'Beverage', img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24094' },
      { name: 'Hot Badam', cat: 'Beverage', img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24095' },
      { name: 'Hot Crispy Chick Burger', cat: 'Burger', img: 'https://images.unsplash.com/photo-1612392062798-2e6f8d6a1d28' },
      { name: 'I Am The King Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b' },
      { name: 'Jackfruit Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1589308078055-eb8cfe3c1f6f' },
      { name: 'Lemon Mint Mojito', cat: 'Mojito', img: 'https://images.unsplash.com/photo-1605270012917-bf157c5a9541' },
      { name: 'Loaded Fries (L)', cat: 'Snacks', img: 'https://images.unsplash.com/photo-1561758033-7e924f619b48' },
      { name: 'Loaded Fries (M)', cat: 'Snacks', img: 'https://images.unsplash.com/photo-1561758033-7e924f619b49' },
      { name: 'Malabar Magic', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704f' },
      { name: 'Mango Banana Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc698' },
      { name: 'Mango Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0c' },
      { name: 'Masala Soda', cat: 'Drink', img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416440' },
      { name: 'Mint Lime', cat: 'Drink', img: 'https://images.unsplash.com/photo-1590080877777-5c0c03d33e0c' },
      { name: 'Mint Lime Soda', cat: 'Drink', img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416441' },
      { name: 'Musambi Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859' },
      { name: 'Normal Avil Milk', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1551024601-bec78aea7050' },
      { name: 'Orange Blossom Mojito', cat: 'Mojito', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55' },
      { name: 'Orange Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1613478223719-2ab802602424' },
      { name: 'Orange Lime', cat: 'Drink', img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416442' },
      { name: 'Passion Fruit Mojito', cat: 'Mojito', img: 'https://images.unsplash.com/photo-1621263764928-df1444c5e860' },
      { name: 'Peri Peri Strips (L)', cat: 'Snacks', img: 'https://images.unsplash.com/photo-1562967914-608f82629710' },
      { name: 'Peri Peri Strips (M)', cat: 'Snacks', img: 'https://images.unsplash.com/photo-1562967914-608f82629711' },
      { name: 'Pineapple Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1622597467836-f3e0c57cbd08' },
      { name: 'Pineapple Lime', cat: 'Drink', img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416443' },
      { name: 'Power Booster Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bbb' },
      { name: 'Royal Fruit Salad', cat: 'Dessert', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cc' },
      { name: 'Sea Blue Mojito', cat: 'Mojito', img: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c' },
      { name: 'Shamam Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c5' },
      { name: 'Sharjah Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1551024601-bec78aea7051' },
      { name: 'Soda Sarbath', cat: 'Drink', img: 'https://images.unsplash.com/photo-1582450871972-ab5ca6416444' },
      { name: 'Special Avil Milk', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1551024601-bec78aea7052' },
      { name: 'Spicy Veg Burger', cat: 'Burger', img: 'https://images.unsplash.com/photo-1550317138-10000687a72c' },
      { name: 'Strawberry Mojito', cat: 'Mojito', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976be' },
      { name: 'Strawberry Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1577805947697-89e18249d768' },
      { name: 'Tea', cat: 'Beverage', img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574' },
      { name: 'Tender Avocado Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1625944525533-473f1c0c8c38' },
      { name: 'Tender Coconut Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24096' },
      { name: 'Tender Mango Shake', cat: 'Milkshake', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc697' },
      { name: 'Veg Burger', cat: 'Burger', img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6' },
      { name: 'Veg Cheese Burger', cat: 'Burger', img: 'https://images.unsplash.com/photo-1606755962773-7d3c8d8f3e2f' },
      { name: 'Veg Sandwich', cat: 'Sandwich', img: 'https://images.unsplash.com/photo-1585238342028-78d387f4a708' },
      { name: 'Vitamin Load Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0d' },
      { name: 'Watermelon Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c6' },
      { name: 'Watermelon Mojito', cat: 'Mojito', img: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796d' },
      { name: 'Weight Loss Juice', cat: 'Juice', img: 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c7' },
      { name: 'Combo Chicken Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1550547660-4d5d3a3e2c8f' },
      { name: 'Combo Sandwich Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba22d' },
      { name: 'Combo Fries Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1561758033-7e924f619b48' },
      { name: 'Combo Juice Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0e' },
      { name: 'Combo Burger Special', cat: 'Combo', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' },
      { name: 'Combo Nuggets Special', cat: 'Combo', img: 'https://images.unsplash.com/photo-1604908177225-2f4c7f9c2c3e' },
      { name: 'Combo Fried Chicken', cat: 'Combo', img: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e91' },
      { name: 'Combo Deluxe Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1550547660-4d5d3a3e2c90' },
      { name: 'Combo Premium Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1561758033-7e924f619b41' },
      { name: 'Combo Family Pack', cat: 'Combo', img: 'https://images.unsplash.com/photo-1550547660-4d5d3a3e2c91' },
      { name: 'Combo Party Pack', cat: 'Combo', img: 'https://images.unsplash.com/photo-1561758033-7e924f619b52' },
      { name: 'Combo Ultimate Meal', cat: 'Combo', img: 'https://images.unsplash.com/photo-1550547660-4d5d3a3e2c92' },
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
          price: '240.00',
          categoryId: savedCats[i.cat].id,
          imageUrl: i.img,
          isVeg: !['Chicken', 'Egg', 'Meat'].some(v => i.name.includes(v))
        }));
        itemsCreated++;
        
        await this.mappingRepo.save(this.mappingRepo.create({
          menuItemId: item.id,
          ingredientId: savedIngs['Base Stock'].id,
          quantityNeeded: '1'
        }));
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
