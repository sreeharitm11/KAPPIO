# Kappio Backend

NestJS backend scaffold aligned to the React screens in [`src (4)/app/components`](/home/sreehari/Documents/Kappio/src%20(4)/app/components).

## Folder Structure

```text
backend/
  src/
    common/           # guards, decorators, filters, response envelope, enums
    config/           # TypeORM bootstrap
    database/entities # normalized PostgreSQL entities
    modules/
      auth/
      categories/
      menu/
      orders/
      delivery/
      payments/
      finance/
      reports/
      notifications/
```

## UI-to-API Mapping

Customer screens

- `CustomerMenu` -> `GET /api/v1/categories`, `GET /api/v1/menu?search=&categoryName=&availableOnly=true`
- `Cart` / `Checkout` -> `POST /api/v1/orders`
- `OrderConfirmation` / future tracking -> `GET /api/v1/orders/track/:orderNumber`

Admin screens

- `AdminDashboard` -> `GET /api/v1/reports/dashboard?period=daily`
- `OrdersManagement` -> `GET /api/v1/orders?page=1&limit=10&status=PENDING`, `PATCH /api/v1/orders/:id/status`, `PATCH /api/v1/orders/:id/acknowledge-comment`
- `MenuManagement` -> `POST /api/v1/menu`, `PATCH /api/v1/menu/:id`, `PATCH /api/v1/menu/:id/toggle-availability`
- `Finance` -> `GET /api/v1/finance/summary`, `GET /api/v1/finance/expenses`, `GET /api/v1/finance/cashbook`, `POST /api/v1/finance/expenses`
- `Reports` -> `GET /api/v1/reports/dashboard`, `GET /api/v1/reports/top-items`, `GET /api/v1/reports/export`

Delivery screens

- `DeliveryOrders` -> `GET /api/v1/delivery/me/orders`
- `OrderDetails` -> `GET /api/v1/orders/:id`, `PATCH /api/v1/delivery/orders/:orderId/status`, `PATCH /api/v1/payments/orders/:orderId/cod/collect`

## Key Architecture Decisions

- Frontend totals are ignored. `OrdersService` recalculates `subtotal`, `deliveryFee`, and `totalAmount` from current menu prices inside a transaction.
- COD collection validates the exact collected amount against `orders.total_amount`, then writes `cash_collection` and `cashbook` in the same transaction.
- Audit timestamps are on every entity through `AppBaseEntity`.
- Tables use a consistent paginated shape:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

- Validation errors return `400`, missing resources return `404`, and unexpected failures return `500` through the global exception filter.
- WebSocket namespace: `/events`
  - `NEW_ORDER`
  - `ORDER_UPDATED`
  - `PAYMENT_COMPLETED`

## Sample Contracts

Create order

```http
POST /api/v1/orders
Content-Type: application/json
```

```json
{
  "customerName": "Alice Brown",
  "customerPhone": "+919876543210",
  "deliveryAddress": "123 Main St, Sector 15, City - 400001",
  "specialInstructions": "Extra hot cappuccino, please.",
  "items": [
    { "menuItemId": "4db4e4cc-2602-48b5-a4b1-52e7a964b0cc", "quantity": 2 },
    { "menuItemId": "e965fcfc-c1b1-4aa5-8e1d-3375ff0ee3bf", "quantity": 1 }
  ]
}
```

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {
    "id": "f3524c73-b448-4136-945f-7bc94c0b2d75",
    "orderNumber": "KAP-59310482",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "subtotal": "480.00",
    "deliveryFee": "40.00",
    "totalAmount": "520.00"
  }
}
```

Update admin order state

```http
PATCH /api/v1/orders/:id/status
Authorization: Bearer <jwt>
```

```json
{
  "status": "PREPARING"
}
```

Collect COD

```http
PATCH /api/v1/payments/orders/:orderId/cod/collect
Authorization: Bearer <jwt>
```

```json
{
  "collectedAmount": 520,
  "notes": "Paid in cash at door"
}
```

Dashboard metrics response

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {
    "period": "daily",
    "metrics": {
      "totalSales": 38500,
      "totalExpenses": 9500,
      "profitLoss": 29000,
      "totalOrders": 142
    },
    "charts": {
      "salesTrend": []
    },
    "recentOrders": []
  }
}
```

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

## Notes For Frontend Integration

- Use JWT for admin, staff, and delivery routes.
- Keep customer ordering public unless you later add customer login to the React app.
- Subscribe to `/events` and update the order table, notification banner, and delivery lists on emitted events.
- The current frontend checkout screen shows UPI/card placeholders, but this backend is implemented for COD as requested. The frontend should switch that screen to COD before integration.
