-- Kappio PostgreSQL schema generated from backend entity definitions
-- Run this after creating the kappio database and user.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'STAFF', 'DELIVERY', 'CUSTOMER');
CREATE TYPE order_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'DELIVERED');
CREATE TYPE delivery_status_enum AS ENUM ('ASSIGNED', 'PICKED_UP', 'DELIVERED');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID');
CREATE TYPE cashbook_entry_type_enum AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE expense_type_enum AS ENUM ('DIRECT', 'INDIRECT');

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name user_role_enum NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(120) NOT NULL,
  email varchar(120) NOT NULL UNIQUE,
  phone varchar(30) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  description varchar(180),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name varchar(160) NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  available boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_menu_items_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number varchar(30) NOT NULL UNIQUE,
  customer_id uuid,
  customer_name varchar(120),
  customer_phone varchar(30) NOT NULL,
  delivery_address text NOT NULL,
  status order_status_enum NOT NULL DEFAULT 'PENDING',
  delivery_status delivery_status_enum NOT NULL DEFAULT 'ASSIGNED',
  payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
  special_instructions text,
  comment_acknowledged boolean NOT NULL DEFAULT false,
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  estimated_delivery_minutes integer NOT NULL DEFAULT 30,
  assigned_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_assigned_by FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
);

CREATE TABLE delivery_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  partner_id uuid NOT NULL,
  status delivery_status_enum NOT NULL DEFAULT 'ASSIGNED',
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_delivery_assignments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_delivery_assignments_partner FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description varchar(180) NOT NULL,
  category varchar(100) NOT NULL,
  type expense_type_enum NOT NULL,
  amount numeric(10,2) NOT NULL,
  created_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE cashbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  type cashbook_entry_type_enum NOT NULL,
  description varchar(180) NOT NULL,
  amount numeric(10,2) NOT NULL,
  balance numeric(12,2) NOT NULL,
  reference_type varchar(60),
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cash_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  collected_by_id uuid NOT NULL,
  expected_amount numeric(10,2) NOT NULL,
  collected_amount numeric(10,2) NOT NULL,
  collected_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_cash_collection_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_cash_collection_collected_by FOREIGN KEY (collected_by_id) REFERENCES users(id) ON DELETE RESTRICT
);
