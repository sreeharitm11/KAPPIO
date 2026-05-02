import { useEffect, useState } from "react";
import { Bell, Printer, Phone, MapPin, Check, X, MessageSquare, CheckCircle2, ChefHat } from "lucide-react";
import { acknowledgeOrderComment, fetchOrders, updateOrderStatus } from "../../orders/api/ordersApi";
import { orderStore } from "../../orders/store/orderStore";
import { notificationsSocket } from "../../../shared/lib/realtime";
import { formatCurrency, timeAgo } from "../../../shared/lib/format";
import type { Order } from "../../../shared/types/api";
import { printCustomerSaleBill, printKitchenOrderTicket } from "../../../shared/lib/thermal-receipt";

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAlert, setShowAlert] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const response = await fetchOrders({ page: 1, limit: 20 });
      setOrders(response.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders");
    }
  };

  useEffect(() => {
    void loadOrders();

    let cancelled = false;
    let socket: Awaited<ReturnType<typeof notificationsSocket.connect>> | null = null;

    const setupSocket = async () => {
      try {
        socket = await notificationsSocket.connect();
        if (cancelled || !socket) return;
        socket.on("NEW_ORDER", () => {
          setShowAlert(true);
          void loadOrders();
        });
        socket.on("ORDER_UPDATED", () => {
          void loadOrders();
        });
      } catch {
        /* socket optional if auth/socket-token fails */
      }
    };

    void setupSocket();

    return () => {
      cancelled = true;
      socket?.off("NEW_ORDER");
      socket?.off("ORDER_UPDATED");
      notificationsSocket.disconnect();
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: "ACCEPTED" | "PREPARING") => {
    await updateOrderStatus(orderId, newStatus);
    await loadOrders();
  };

  const acknowledgeComment = async (orderId: string) => {
    await acknowledgeOrderComment(orderId);
    await loadOrders();
    orderStore.updateOrder({ commentAcknowledged: true });
  };

  return (
    <div className="p-8 bg-[#FBF8F3] min-h-screen">
      {showAlert && (
        <div className="bg-gradient-to-r from-[#D4A574]/20 to-[#B85C3E]/20 border-2 border-[#D4A574] rounded-2xl p-5 mb-6 flex items-start gap-3 shadow-lg">
          <Bell className="w-6 h-6 text-[#B85C3E] mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="text-[#2C1810] mb-1">New Order Alert!</h4>
            <p className="text-sm text-[#6B5D52]">A new order has just arrived.</p>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-[#B85C3E] hover:text-[#A04A31]">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-[#2C1810]">Orders Management</h1>
        <p className="text-[#6B5D52] mt-1">View and manage all incoming orders in real-time</p>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className={`p-6 border-b-2 border-[#E8DCC8] ${
              order.status === "PENDING" ? "bg-gradient-to-r from-[#D4A574]/10 to-[#B85C3E]/10" : "bg-white"
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[#2C1810]">{order.orderNumber}</h3>
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm ${
                        order.status === "PENDING"
                          ? "bg-[#D4A574] text-white"
                          : order.status === "PREPARING"
                          ? "bg-[#6B9B8F] text-white"
                          : "bg-[#B85C3E] text-white"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[#6B5D52]">{timeAgo(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-[#B85C3E]">{formatCurrency(order.totalAmount)}</h2>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-[#6B5D52] mb-1">Customer</p>
                  <p className="text-[#2C1810]">{order.customerName ?? "Walk-in Customer"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B5D52] mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Phone
                  </p>
                  <p className="text-[#2C1810]">{order.customerPhone}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-[#6B5D52] mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </p>
                <p className="text-[#2C1810]">{order.deliveryAddress}</p>
              </div>

              <div className="bg-[#F4E8D8] rounded-xl p-4 mb-4">
                <p className="mb-2 text-[#2C1810]">Order Items:</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-[#6B5D52]">
                      <span>
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>{formatCurrency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.specialInstructions && (
                <div className={`rounded-xl p-4 mb-4 border-2 ${
                  order.commentAcknowledged
                    ? "bg-[#6B9B8F]/10 border-[#6B9B8F]/30"
                    : "bg-[#D4A574]/10 border-[#D4A574]"
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    <MessageSquare className={`w-5 h-5 mt-0.5 ${
                      order.commentAcknowledged ? "text-[#6B9B8F]" : "text-[#B85C3E]"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-[#2C1810] mb-1">Special Instructions:</p>
                      <p className="text-[#2C1810] italic">"{order.specialInstructions}"</p>
                    </div>
                  </div>
                  {!order.commentAcknowledged && (
                    <button
                      onClick={() => void acknowledgeComment(order.id)}
                      className="w-full bg-gradient-to-r from-[#6B9B8F] to-[#4A7C71] text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Acknowledge Request
                    </button>
                  )}
                  {order.commentAcknowledged && (
                    <div className="flex items-center gap-2 text-[#6B9B8F] text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Request acknowledged</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {order.status === "PENDING" && (
                  <button
                    onClick={() => void updateStatus(order.id, "ACCEPTED")}
                    className="flex-1 min-w-[140px] bg-gradient-to-r from-[#6B9B8F] to-[#4A7C71] text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Accept Order
                  </button>
                )}
                {order.status === "ACCEPTED" && (
                  <button
                    onClick={() => void updateStatus(order.id, "PREPARING")}
                    className="flex-1 min-w-[140px] bg-gradient-to-r from-[#B85C3E] to-[#A04A31] text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Start Preparing
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => printKitchenOrderTicket(order)}
                  className="bg-white border-2 border-[#E8DCC8] px-4 py-3 rounded-xl hover:bg-[#F4E8D8] transition-colors flex items-center gap-2 text-[#2C1810]"
                  title="58mm thermal — kitchen copy"
                >
                  <ChefHat className="w-4 h-4" />
                  Print KOT
                </button>
                <button
                  type="button"
                  onClick={() => printCustomerSaleBill(order)}
                  className="bg-white border-2 border-[#E8DCC8] px-4 py-3 rounded-xl hover:bg-[#F4E8D8] transition-colors flex items-center gap-2 text-[#2C1810]"
                  title="58mm thermal — customer bill"
                >
                  <Printer className="w-4 h-4" />
                  Print bill
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
