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

  console.log('Seeding Menu Categories and Items...');

  const menuData = [
    {
      category: 'Mojito',
      description: 'Refreshing classic and fruit mojitos',
      items: [
        { name: 'Passion Fruit Mojito', price: '69.00', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80' },
        { name: 'Sea Blue Mojito', price: '69.00', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' },
        { name: 'Strawberry Mojito', price: '69.00', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
      ],
    },
    {
      category: 'Exact Falooda',
      description: 'Rich and creamy authentic faloodas',
      items: [
        { name: 'Arctic Bay (Strawberry, Vanilla)', price: '120.00', image: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?w=400&q=80' },
        { name: 'Choco Nut (Choco, Vanilla)', price: '150.00', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80' },
        { name: 'Classic Falooda', price: '100.00', image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80' },
      ],
    },
    {
      category: 'Live Burger',
      description: 'Freshly prepared hot burgers',
      items: [
        { name: 'Veg Burger', price: '69.00', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80' },
        { name: 'Chicken Burger', price: '79.00', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
        { name: 'Hot Crispy Chick Burger', price: '89.00', image: 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=400&q=80' },
      ],
    },
    {
      category: 'Club Sandwich',
      description: 'Classic multilayered sandwiches',
      items: [
        { name: 'Veg Sandwich', price: '79.00', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80' },
        { name: 'Chicken Sandwich', price: '89.00', image: 'https://images.unsplash.com/photo-1553909489-cd47ce5631c3?w=400&q=80' },
        { name: 'Chicken Crispy Sandwich', price: '99.00', image: 'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=400&q=80' },
      ],
    },
    {
      category: 'Apatiters',
      description: 'Hot appetizers and sides',
      items: [
        { name: 'French Fries (M)', price: '59.00', image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&q=80' },
        { name: 'Chicken Nuggets', price: '65.00', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80' },
        { name: 'Loaded Fries', price: '99.00', image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&q=80' },
      ],
    },
    {
      category: 'Juice & Shakes',
      description: 'Freshly squeezed juices and milkshakes',
      items: [
        { name: 'Sharjah Shake', price: '59.00', image: 'https://images.unsplash.com/photo-1572490122747-3968b75bb8ef?w=400&q=80' },
        { name: 'Mango Juice', price: '69.00', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80' },
        { name: 'Avocado Shake', price: '79.00', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80' },
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
          isPopular: Math.random() > 0.7,
        });
        console.log(`Created Item: ${itemData.name} - ₹${itemData.price}`);
      }
    }
  }

  console.log('Seeding complete!');
  await app.close();
}

bootstrap().catch(console.error);
