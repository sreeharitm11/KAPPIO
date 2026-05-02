import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser } from 'json2csv';
import { Repository } from 'typeorm';
import { Expense } from '../../database/entities/expense.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Order } from '../../database/entities/order.entity';
import { toMoneyNumber } from '../../common/utils/money.util';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
  ) {}

  async dashboard(query: ReportQueryDto) {
    const orders = await this.ordersRepository.find({
      relations: ['items', 'items.menuItem'],
      order: { createdAt: 'DESC' },
    });
    const expenses = await this.expensesRepository.find({
      order: { createdAt: 'DESC' },
    });

    const totalSales = orders.reduce((sum, order) => sum + toMoneyNumber(order.totalAmount), 0);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + toMoneyNumber(expense.amount),
      0,
    );
    const totalOrders = orders.length;
    const profitLoss = totalSales - totalExpenses;

    return {
      period: query.period,
      metrics: {
        totalSales,
        totalExpenses,
        profitLoss,
        totalOrders,
      },
      charts: {
        salesTrend: orders.slice(0, 7).map((order) => ({
          label: order.createdAt.toISOString().slice(0, 10),
          sales: toMoneyNumber(order.totalAmount),
        })),
      },
      recentOrders: orders.slice(0, 10).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: toMoneyNumber(order.totalAmount),
        status: order.status,
        createdAt: order.createdAt,
      })),
    };
  }

  async topItems(query: ReportQueryDto) {
    const rows = await this.orderItemsRepository.find({
      relations: ['menuItem', 'order'],
      order: { createdAt: 'DESC' },
    });

    const grouped = new Map<
      string,
      { itemName: string; unitsSold: number; revenue: number }
    >();

    for (const row of rows) {
      const existing = grouped.get(row.menuItemId) ?? {
        itemName: row.menuItem.name,
        unitsSold: 0,
        revenue: 0,
      };
      existing.unitsSold += row.quantity;
      existing.revenue += toMoneyNumber(row.lineTotal);
      grouped.set(row.menuItemId, existing);
    }

    return {
      period: query.period,
      items: Array.from(grouped.values())
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 10),
    };
  }

  async exportCsv(query: ReportQueryDto) {
    const dashboard = await this.dashboard(query);
    const topItems = await this.topItems(query);
    const parser = new Parser({
      fields: ['section', 'label', 'value'],
    });

    const rows = [
      { section: 'metrics', label: 'totalSales', value: dashboard.metrics.totalSales },
      { section: 'metrics', label: 'totalExpenses', value: dashboard.metrics.totalExpenses },
      { section: 'metrics', label: 'profitLoss', value: dashboard.metrics.profitLoss },
      { section: 'metrics', label: 'totalOrders', value: dashboard.metrics.totalOrders },
      ...topItems.items.map((item) => ({
        section: 'topItems',
        label: item.itemName,
        value: `${item.unitsSold} units / ${item.revenue} revenue`,
      })),
    ];

    return {
      fileName: `kappio-report-${query.period}.csv`,
      content: parser.parse(rows),
      contentType: 'text/csv',
    };
  }
}
