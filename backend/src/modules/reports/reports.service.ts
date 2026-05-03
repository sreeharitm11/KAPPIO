import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser } from 'json2csv';
import { Between, In, Repository } from 'typeorm';
import { ReportPeriod } from '../../common/enums/report-period.enum';
import { Expense } from '../../database/entities/expense.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Order } from '../../database/entities/order.entity';
import { CashbookEntry } from '../../database/entities/cashbook-entry.entity';
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
    @InjectRepository(CashbookEntry)
    private readonly cashbookRepository: Repository<CashbookEntry>,
  ) {}

  private getDateRange(period: ReportPeriod, anchor?: string, startIn?: string, endIn?: string) {
    if (period === ReportPeriod.CUSTOM && startIn && endIn) {
      return Between(new Date(startIn), new Date(endIn));
    }
    const end = anchor ? new Date(anchor) : new Date();
    const start = new Date(end);
    if (period === ReportPeriod.DAILY) start.setHours(0, 0, 0, 0);
    else if (period === ReportPeriod.WEEKLY) start.setDate(end.getDate() - 7);
    else if (period === ReportPeriod.MONTHLY) start.setMonth(end.getMonth() - 1);
    return Between(start, end);
  }

  async dashboard(query: ReportQueryDto) {
    const range = this.getDateRange(query.period, query.anchorDate, query.startDate, query.endDate);
    const orders = await this.ordersRepository.find({
      where: { createdAt: range },
      relations: ['items', 'items.menuItem'],
      order: { createdAt: 'DESC' },
    });
    const expenses = await this.expensesRepository.find({
      where: { createdAt: range },
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
    const range = this.getDateRange(query.period, query.anchorDate, query.startDate, query.endDate);
    const rows = await this.orderItemsRepository.find({
      where: { createdAt: range },
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
    const range = this.getDateRange(query.period, query.anchorDate, query.startDate, query.endDate);

    if (query.type === 'CASHBOOK') {
      return this.exportCashbookCsv(range, query.period);
    }

    return this.exportSalesRegisterCsv(range, query.period);
  }

  private async exportSalesRegisterCsv(range: any, period: string) {
    const orders = await this.ordersRepository.find({
      where: { createdAt: range },
      relations: ['items', 'items.menuItem'],
      order: { createdAt: 'ASC' },
      take: 5000, // safety cap — prevents OOM on large date ranges
    });

    const parser = new Parser({
      fields: [
        { label: 'Invoice No', value: 'invoiceNo' },
        { label: 'Invoice Date', value: 'date' },
        { label: 'Customer Name', value: 'customer' },
        { label: 'Customer Phone', value: 'phone' },
        { label: 'Order Type', value: 'type' },
        { label: 'Payment Method', value: 'method' },
        { label: 'Payment Status', value: 'paymentStatus' },
        { label: 'Item Name', value: 'itemName' },
        { label: 'Quantity', value: 'qty' },
        { label: 'Unit Price', value: 'price' },
        { label: 'Taxable Value', value: 'taxable' },
        { label: 'CGST (2.5%)', value: 'cgst' },
        { label: 'SGST (2.5%)', value: 'sgst' },
        { label: 'Total Tax', value: 'tax' },
        { label: 'Total Amount', value: 'total' },
      ],
    });

    const rows: any[] = [];
    let totalTaxable = 0;
    let totalTax = 0;
    let totalFinal = 0;

    orders.forEach((o) => {
      o.items.forEach((item) => {
        const taxable = toMoneyNumber(item.lineTotal) / 1.05; // 5% GST assumption
        const tax = toMoneyNumber(item.lineTotal) - taxable;
        const cgst = tax / 2;
        const sgst = tax / 2;

        totalTaxable += taxable;
        totalTax += tax;
        totalFinal += toMoneyNumber(item.lineTotal);

        rows.push({
          invoiceNo: o.orderNumber,
          date: o.createdAt.toLocaleDateString('en-IN'),
          customer: o.customerName ?? 'Guest',
          phone: o.customerPhone,
          type: 'Delivery',
          method: o.paymentStatus === 'PAID' ? 'UPI' : 'COD',
          paymentStatus: o.paymentStatus,
          itemName: item.menuItem.name,
          qty: item.quantity,
          price: toMoneyNumber(item.unitPrice),
          taxable: taxable.toFixed(2),
          cgst: cgst.toFixed(2),
          sgst: sgst.toFixed(2),
          tax: tax.toFixed(2),
          total: toMoneyNumber(item.lineTotal).toFixed(2),
        });
      });
      
      // Add delivery fee as a separate row if > 0
      if (toMoneyNumber(o.deliveryFee) > 0) {
        const fee = toMoneyNumber(o.deliveryFee);
        totalFinal += fee;
        rows.push({
          invoiceNo: o.orderNumber,
          date: o.createdAt.toLocaleDateString('en-IN'),
          itemName: 'Delivery Charges',
          qty: 1,
          price: fee,
          taxable: fee,
          cgst: '0.00',
          sgst: '0.00',
          tax: '0.00',
          total: fee.toFixed(2),
        });
      }
    });

    // Add totals row
    rows.push({});
    rows.push({
      invoiceNo: 'TOTALS',
      taxable: totalTaxable.toFixed(2),
      tax: totalTax.toFixed(2),
      total: totalFinal.toFixed(2),
    });

    return {
      fileName: `sales-register-${period}-${new Date().toISOString().slice(0, 10)}.csv`,
      content: parser.parse(rows),
      contentType: 'text/csv',
    };
  }

  private async exportCashbookCsv(range: any, period: string) {
    const entries = await this.cashbookRepository.find({
      where: { createdAt: range },
      order: { createdAt: 'ASC' },
    });

    const parser = new Parser({
      fields: [
        { label: 'Date', value: 'date' },
        { label: 'Type', value: 'type' },
        { label: 'Description', value: 'description' },
        { label: 'Reference ID', value: 'ref' },
        { label: 'Debit (Expense)', value: 'debit' },
        { label: 'Credit (Income)', value: 'credit' },
        { label: 'Balance', value: 'balance' },
      ],
    });

    const rows = entries.map((e) => ({
      date: e.createdAt.toLocaleDateString('en-IN'),
      type: e.type,
      description: e.description,
      ref: e.referenceId ?? '-',
      debit: e.type === 'DEBIT' ? toMoneyNumber(e.amount).toFixed(2) : '0.00',
      credit: e.type === 'CREDIT' ? toMoneyNumber(e.amount).toFixed(2) : '0.00',
      balance: toMoneyNumber(e.balance).toFixed(2),
    }));

    return {
      fileName: `cashbook-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`,
      content: parser.parse(rows),
      contentType: 'text/csv',
    };
  }
}
