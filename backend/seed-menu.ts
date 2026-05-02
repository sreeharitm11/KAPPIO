import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { Repository } from 'typeorm';
import { Category } from './src/database/entities/category.entity';
import { MenuItem } from './src/database/entities/menu-item.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoryRepo = app.get<Repository<Category>>(getRepositoryToken(Category));
  const menuItemRepo = app.get<Repository<MenuItem>>(getRepositoryToken(MenuItem));

  console.log('Clearing existing menu data to ensure clean state...');
  // Delete all items first, then categories, to avoid foreign key constraint errors
  await menuItemRepo.query('DELETE FROM order_items'); // Also delete order_items referencing menu_items
  await menuItemRepo.query('DELETE FROM menu_items');
  await categoryRepo.query('DELETE FROM categories');

  console.log('Seeding Menu Categories and Items...');

  const images = {
    mojito: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80',
    falooda: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?w=400&q=80',
    burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
    fries: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&q=80',
    chickenNuggets: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80',
    fruitSalad: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80',
    milk: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&q=80',
    shake: 'https://images.unsplash.com/photo-1572490122747-3968b75bb8ef?w=400&q=80',
    friedChicken: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
    juice: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
    lime: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80',
    teaCoffee: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80',
    combo: 'https://images.unsplash.com/photo-1594212848116-b8ead150d322?w=400&q=80',
  };

  const menuData = [
    {
      category: 'Mojito',
      description: 'Refreshing classic and fruit mojitos',
      items: [
        { name: 'Passion Fruit Mojito', price: '69.00', image: images.mojito },
        { name: 'Sea Blue Mojito', price: '69.00', image: images.mojito },
        { name: 'Strawberry Mojito', price: '69.00', image: images.mojito },
        { name: 'Lemon Mint Mojito', price: '69.00', image: images.mojito },
        { name: 'Green Apple Mojito', price: '69.00', image: images.mojito },
        { name: 'Watermelon Mojito', price: '69.00', image: images.mojito },
        { name: 'Orange Blossom Mojito', price: '69.00', image: images.mojito },
      ],
    },
    {
      category: 'Exotic Falooda',
      description: 'Rich and creamy authentic faloodas',
      items: [
        { name: 'Arctic Bay (Strawberry, Vanilla)', price: '120.00', image: images.falooda },
        { name: 'Choco Nut (Chocolate, Vanilla, Chocolate)', price: '150.00', image: images.falooda },
        { name: 'Malabar Magic (Pista, Vanilla)', price: '130.00', image: images.falooda },
        { name: 'Classic Falooda (Vanilla, Vanilla)', price: '100.00', image: images.falooda },
      ],
    },
    {
      category: 'Appetizers',
      description: 'Hot appetizers and sides',
      items: [
        { name: 'French Fries (M)', price: '59.00', image: images.fries },
        { name: 'French Fries (L)', price: '89.00', image: images.fries },
        { name: 'Chicken Fingers (M)', price: '65.00', image: images.chickenNuggets },
        { name: 'Chicken Fingers (L)', price: '99.00', image: images.chickenNuggets },
        { name: 'Chicken Nuggets (M)', price: '65.00', image: images.chickenNuggets },
        { name: 'Chicken Nuggets (L)', price: '99.00', image: images.chickenNuggets },
        { name: 'Crispy Strips (M)', price: '89.00', image: images.chickenNuggets },
        { name: 'Crispy Strips (L)', price: '125.00', image: images.chickenNuggets },
        { name: 'Loaded Fries (M)', price: '99.00', image: images.fries },
        { name: 'Loaded Fries (L)', price: '129.00', image: images.fries },
        { name: 'Peri Peri Strips (M)', price: '95.00', image: images.chickenNuggets },
        { name: 'Peri Peri Strips (L)', price: '130.00', image: images.chickenNuggets },
      ],
    },
    {
      category: 'Fruit Salad',
      description: 'Fresh and healthy fruit salads',
      items: [
        { name: 'Classic Fruit Salad', price: '59.00', image: images.fruitSalad },
        { name: 'Royal Fruit Salad', price: '79.00', image: images.fruitSalad },
      ],
    },
    {
      category: 'Avil Milk',
      description: 'Traditional and special avil milk drinks',
      items: [
        { name: 'Normal Avil Milk', price: '49.00', image: images.milk },
        { name: 'Special Avil Milk', price: '59.00', image: images.milk },
        { name: 'Fruit Mix Avil Milk', price: '69.00', image: images.milk },
        { name: 'Dry Fruit Mix Avil Milk', price: '69.00', image: images.milk },
        { name: 'Fruit and Nut Avil Milk', price: '79.00', image: images.milk },
      ],
    },
    {
      category: 'Special Shakes',
      description: 'Premium thick milkshakes',
      items: [
        { name: 'Mango Banana Shake', price: '79.00', image: images.shake },
        { name: 'Avocado Mango Shake', price: '89.00', image: images.shake },
        { name: 'Tender Avocado Shake', price: '89.00', image: images.shake },
        { name: 'Tender Mango Shake', price: '89.00', image: images.shake },
      ],
    },
    {
      category: 'Club Sandwich',
      description: 'Classic multilayered sandwiches',
      items: [
        { name: 'Veg Sandwich', price: '79.00', image: images.sandwich },
        { name: 'Egg Sandwich', price: '79.00', image: images.sandwich },
        { name: 'Chicken Sandwich', price: '89.00', image: images.sandwich },
        { name: 'Chicken Crispy Sandwich', price: '99.00', image: images.sandwich },
      ],
    },
    {
      category: 'Live Burger',
      description: 'Freshly prepared hot burgers',
      items: [
        { name: 'Veg Burger', price: '69.00', image: images.burger },
        { name: 'Egg Burger', price: '69.00', image: images.burger },
        { name: 'Spicy Veg Burger', price: '79.00', image: images.burger },
        { name: 'Chicken Burger', price: '79.00', image: images.burger },
        { name: 'Veg Cheese Burger', price: '89.00', image: images.burger },
        { name: 'Hot Crispy Chick Burger', price: '89.00', image: images.burger },
        { name: 'Chicken Cheese Burger', price: '99.00', image: images.burger },
        { name: 'Crispy Chick Cheese Burger', price: '109.00', image: images.burger },
      ],
    },
    {
      category: 'Fried Chicken',
      description: 'Crispy and juicy fried chicken',
      items: [
        { name: 'Fried Chicken (Qtr)', price: '150.00', image: images.friedChicken },
        { name: 'Fried Chicken (Half)', price: '280.00', image: images.friedChicken },
        { name: 'Fried Chicken (Full)', price: '540.00', image: images.friedChicken },
      ],
    },
    {
      category: 'Healthy Shakes',
      description: 'Nutritious shakes for a healthy boost',
      items: [
        { name: 'Power Booster (Carrot, Beetroot, Apple)', price: '100.00', image: images.shake },
        { name: 'Vitamin Load (Anar, Strawberry, Watermelon)', price: '120.00', image: images.shake },
        { name: 'Weight Loss (Cucumber, Mint, Lemon)', price: '90.00', image: images.shake },
        { name: 'I Am The King (Apple, Pineapple, Carrot)', price: '110.00', image: images.shake },
      ],
    },
    {
      category: 'Fresh Juice',
      description: 'Freshly squeezed juices',
      items: [
        { name: 'Watermelon Juice', price: '39.00', image: images.juice },
        { name: 'Grape Juice', price: '59.00', image: images.juice },
        { name: 'Musambi Juice', price: '59.00', image: images.juice },
        { name: 'Carrot Juice', price: '59.00', image: images.juice },
        { name: 'Pineapple Juice', price: '59.00', image: images.juice },
        { name: 'Orange Juice', price: '59.00', image: images.juice },
      ],
    },
    {
      category: 'Lime',
      description: 'Refreshing lime drinks',
      items: [
        { name: 'Fresh Lime', price: '20.00', image: images.lime },
        { name: 'Mint Lime', price: '25.00', image: images.lime },
        { name: 'Pineapple Lime', price: '30.00', image: images.lime },
        { name: 'Orange Lime', price: '30.00', image: images.lime },
        { name: 'Grape Lime', price: '30.00', image: images.lime },
        { name: 'Ginger Lime', price: '30.00', image: images.lime },
      ],
    },
    {
      category: 'Juice & Shakes',
      description: 'Classic juices and milkshakes',
      items: [
        { name: 'Sharjah Shake', price: '59.00', image: images.shake },
        { name: 'Shamam Juice', price: '59.00', image: images.juice },
        { name: 'Chikoo Shake', price: '69.00', image: images.shake },
        { name: 'Mango Juice', price: '69.00', image: images.juice },
        { name: 'Tender Coconut Shake', price: '69.00', image: images.shake },
        { name: 'Strawberry Shake', price: '69.00', image: images.shake },
        { name: 'Avocado Shake', price: '79.00', image: images.shake },
        { name: 'Apple Juice', price: '79.00', image: images.juice },
        { name: 'Anar Juice', price: '79.00', image: images.juice },
        { name: 'Jackfruit Shake', price: '79.00', image: images.shake },
      ],
    },
    {
      category: 'Hot Beverages',
      description: 'Hot teas, coffees and milk drinks',
      items: [
        { name: 'Tea', price: '10.00', image: images.teaCoffee },
        { name: 'Coffee', price: '15.00', image: images.teaCoffee },
        { name: 'Boost', price: '15.00', image: images.teaCoffee },
        { name: 'Horlicks', price: '15.00', image: images.teaCoffee },
        { name: 'Hot Badam', price: '15.00', image: images.teaCoffee },
      ],
    },
    {
      category: 'Sodas',
      description: 'Fizzy refreshing sodas',
      items: [
        { name: 'Fresh Lime Soda', price: '20.00', image: images.lime },
        { name: 'Chilli Soda', price: '30.00', image: images.lime },
        { name: 'Masala Soda', price: '30.00', image: images.lime },
        { name: 'Mint Lime Soda', price: '30.00', image: images.lime },
        { name: 'Soda Sarbath', price: '30.00', image: images.lime },
      ],
    },
    {
      category: 'Combos & Meals',
      description: 'Value combo meals',
      items: [
        { name: 'Combo: Burger (Veg/Chick) + Sharjah (Mango/Strawberry)', price: '145.00', image: images.combo },
        { name: 'Combo: Burger (Veg/Chick) + Avil Milk', price: '135.00', image: images.combo },
        { name: 'Combo: Burger (Veg/Chick) + Fries(M) / Nuggets (M) + Sharjah (Mango/Strawberry)', price: '207.00', image: images.combo },
        { name: 'Combo: Club Sandwich (Veg/Chick) + Fries(M) / Nuggets (M) + Sharjah (Mango/Strawberry)', price: '217.00', image: images.combo },
        { name: 'Combo: Cheese Burger (Veg/Chick) + Chicken Nuggets (M) + Avil Milk S.P', price: '225.00', image: images.combo },
        { name: 'Combo: Chicken Nuggets + French Fries + Watermelon/Pineapple Juice (M)', price: '163.00', image: images.combo },
        { name: 'Combo: Chicken Nuggets + French Fries + Watermelon/Pineapple Juice (L)', price: '227.00', image: images.combo },
        { name: 'Combo: Hot Crispy Burger/Sandwich + Loaded Fries (M)/Peri Peri Strips (M) + Avocado/Tender/Jackfruit (Juice)', price: '277.00', image: images.combo },
        { name: 'Combo: Crispy Chick Cheese Burger + Chicken Nuggets (M) + Dry Fruits Mix Avil Milk', price: '243.00', image: images.combo },
        { name: 'Combo: Hot Crispy Chick Burger + French Fries (M) + Mango Juice', price: '217.00', image: images.combo },
        { name: 'Combo: Fried Chicken (Qtr) + Loaded Fries (M) + Fresh Lime Soda', price: '269.00', image: images.combo },
        { name: 'Combo: Chicken Crispy Sandwich + Peri Peri Strips (M) + Mint Lime', price: '219.00', image: images.combo },
        { name: 'Combo: Fried Chicken (Qtr) + French Fries (M) + Fresh Lime Soda', price: '229.00', image: images.combo },
        { name: 'Combo: Veg/Chicken Burger + Classic Fruits Salad A.B.C', price: '245.00', image: images.combo },
      ],
    },
  ];

  for (const catData of menuData) {
    let category = await categoryRepo.findOne({ where: { name: catData.category } });
    if (!category) {
      category = await categoryRepo.save({
        name: catData.category,
        description: catData.description,
      });
      console.log(`Created Category: ${category.name}`);
    }

    for (const itemData of catData.items) {
      const existing = await menuItemRepo.findOne({ where: { name: itemData.name, categoryId: category.id } });
      if (!existing) {
        await menuItemRepo.save({
          categoryId: category.id,
          name: itemData.name,
          price: itemData.price,
          imageUrl: itemData.image,
          available: true,
          isPopular: Math.random() > 0.8, // 20% chance to be popular
        });
        console.log(`Created Item: ${itemData.name} - ₹${itemData.price}`);
      }
    }
  }

  console.log('Seeding complete!');
  await app.close();
}

bootstrap().catch(console.error);
