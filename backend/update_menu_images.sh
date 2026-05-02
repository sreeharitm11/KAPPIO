#!/bin/bash
# Script to update menu item images with category-specific, unique Unsplash photos
# Each category gets a distinct, high-quality image

PGPASSWORD=kappio_pass
DB="psql -U kappio -d kappio -h localhost"

echo "Updating menu item images..."

# ========= CATEGORY: Biryani =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1563379091339-03246963d96a?auto=format&fit=crop&q=80&w=800' WHERE name = 'Chicken Biryani';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&q=80&w=800' WHERE name = 'Egg Biryani';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Veg%Biryani%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Biryani%' AND name NOT ILIKE '%Chicken%' AND name NOT ILIKE '%Egg%' AND name NOT ILIKE '%Veg%';"

# ========= CATEGORY: Coffee =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Cappuccino%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Latte%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Espresso%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Cold Coffee%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Frappe%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Black Coffee%' OR name ILIKE '%Filter Coffee%' OR name = 'Coffee';"

# ========= CATEGORY: Hot Beverages =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&q=80&w=800' WHERE name = 'Tea';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800' WHERE name = 'Boost';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800' WHERE name = 'Horlicks';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800' WHERE name = 'Hot Badam';"

# ========= CATEGORY: Live Burger =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800' WHERE name = 'Chicken Burger';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=800' WHERE name = 'Chicken Cheese Burger';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800' WHERE name = 'Crispy Chick Cheese Burger';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?auto=format&fit=crop&q=80&w=800' WHERE name = 'Egg Burger';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&q=80&w=800' WHERE name = 'Hot Crispy Chick Burger';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&q=80&w=800' WHERE name = 'Spicy Veg Burger';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=800' WHERE name = 'Veg Burger';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=800' WHERE name = 'Veg Cheese Burger';"

# ========= CATEGORY: Juice & Shakes =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800' WHERE name = 'Mango Juice';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800' WHERE name = 'Apple Juice';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1547496614-1c4f7c8f6ba4?auto=format&fit=crop&q=80&w=800' WHERE name = 'Anar Juice';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1553530979-fbb9e4aee36f?auto=format&fit=crop&q=80&w=800' WHERE name = 'Avocado Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?auto=format&fit=crop&q=80&w=800' WHERE name = 'Strawberry Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800' WHERE name = 'Chikoo Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1510024661809-74a698e7a09f?auto=format&fit=crop&q=80&w=800' WHERE name = 'Tender Coconut Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?auto=format&fit=crop&q=80&w=800' WHERE name = 'Jackfruit Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1617878258432-f8b9c1b8b9f8?auto=format&fit=crop&q=80&w=800' WHERE name = 'Sharjah Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1553530979-fbb9e4aee36f?auto=format&fit=crop&q=80&w=800' WHERE name = 'Shamam Juice';"

# ========= CATEGORY: Mojito =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&q=80&w=800' WHERE name = 'Lemon Mint Mojito';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1587244038553-68e90f3a7c6c?auto=format&fit=crop&q=80&w=800' WHERE name = 'Strawberry Mojito';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800' WHERE name = 'Watermelon Mojito';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1547496615-7d6de1679e96?auto=format&fit=crop&q=80&w=800' WHERE name = 'Green Apple Mojito';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1560508179-b2c9a3555772?auto=format&fit=crop&q=80&w=800' WHERE name = 'Orange Blossom Mojito';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1498092651296-641e88c3b057?auto=format&fit=crop&q=80&w=800' WHERE name = 'Passion Fruit Mojito';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?auto=format&fit=crop&q=80&w=800' WHERE name = 'Sea Blue Mojito';"

# ========= CATEGORY: Sodas =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1545488617-f9e4b45b8b55?auto=format&fit=crop&q=80&w=800' WHERE name = 'Fresh Lime Soda';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800' WHERE name = 'Mint Lime Soda';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&q=80&w=800' WHERE name = 'Chilli Soda';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1625865931544-ab98f6c78e19?auto=format&fit=crop&q=80&w=800' WHERE name = 'Masala Soda';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1545488617-f9e4b45b8b55?auto=format&fit=crop&q=80&w=800' WHERE name = 'Soda Sarbath';"

# ========= CATEGORY: Lime =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=800' WHERE name = 'Fresh Lime';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800' WHERE name = 'Mint Lime';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1476107767453-e1ba1a75c4c4?auto=format&fit=crop&q=80&w=800' WHERE name = 'Ginger Lime';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1560508179-b2c9a3555772?auto=format&fit=crop&q=80&w=800' WHERE name = 'Orange Lime';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=800' WHERE name = 'Grape Lime';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1546910819-e7a1ac8f2e33?auto=format&fit=crop&q=80&w=800' WHERE name = 'Pineapple Lime';"

# ========= CATEGORY: Special Shakes =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1553530979-fbb9e4aee36f?auto=format&fit=crop&q=80&w=800' WHERE name = 'Avocado Mango Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800' WHERE name = 'Mango Banana Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1553530979-fbb9e4aee36f?auto=format&fit=crop&q=80&w=800' WHERE name = 'Tender Avocado Shake';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800' WHERE name = 'Tender Mango Shake';"

# ========= CATEGORY: Fruit Salad =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1568158879083-c42860933ed7?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Fruit Salad%';"

# ========= CATEGORY: Healthy Shakes =========
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Carrot%' OR name ILIKE '%Beetroot%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1624454002302-37ee1c0e4278?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Cucumber%' OR name ILIKE '%Weight Loss%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1547496614-1c4f7c8f6ba4?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Vitamin%' OR name ILIKE '%Strawberry%Watermelon%';"
$DB -c "UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%I Am The King%' OR name ILIKE '%Apple%Pineapple%';"

echo "Done! All menu images updated."
