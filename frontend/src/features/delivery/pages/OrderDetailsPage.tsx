import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Phone, MapPin, Navigation, CheckCircle, Package, Printer } from "lucide-react";
import { fetchOrderById } from "../../orders/api/ordersApi";
import { collectCodPayment, updateDeliveryStatus } from "../api/deliveryApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { Order } from "../../../shared/types/api";
import { printCustomerSaleBill } from "../../../shared/lib/thermal-receipt";

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"ASSIGNED" | "PICKED_UP" | "DELIVERED">("ASSIGNED");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const load = async () => {
      try {
        const response = await fetchOrderById(orderId);
        setOrder(response);
        setStatus(response.deliveryStatus);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load order");
      }
    };

    void load();
  }, [orderId]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-xl border border-[#E8DCC8] p-8 text-center shadow-sm">
          <h2 className="text-[#2C1810]">{error ?? "Order not found"}</h2>
        </div>
      </div>
    );
  }

  const handleCallCustomer = () => {
    window.location.href = `tel:${order.customerPhone}`;
  };

  const handleOpenMaps = () => {
    const encodedAddress = encodeURIComponent(order.deliveryAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  const handleMarkDelivered = async () => {
    if (!orderId) return;
    if (confirm("Mark this order as delivered and collect COD?")) {
      try {
        await updateDeliveryStatus(orderId, "DELIVERED");
        await collectCodPayment(orderId, Number(order.totalAmount));
        alert("Order marked as delivered and COD collected successfully!");
        navigate("/deliverypartner");
      } catch (actionError) {
        alert(actionError instanceof Error ? actionError.message : "Unable to complete delivery");
      }
    }
  };

  const handlePickup = async () => {
    if (!orderId) return;
    try {
      await updateDeliveryStatus(orderId, "PICKED_UP");
      setStatus("PICKED_UP");
    } catch (actionError) {
      alert(actionError instanceof Error ? actionError.message : "Unable to update delivery");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2C1810]">Order #{order.orderNumber}</h1>
        <p className="text-[#6B5D52] mt-1">Delivery details and navigation</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E8DCC8] shadow-sm mb-4 overflow-hidden">
        <div className="p-4 border-b border-[#E8DCC8] bg-[#FBF8F3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D4A574]" />
              <span className="font-semibold text-[#2C1810]">Order Status</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                status === "ASSIGNED"
                  ? "bg-[#E8DCC8] text-[#6B4423]"
                  : status === "PICKED_UP"
                  ? "bg-[#D4A574] text-[#2C1810]"
                  : "bg-white border border-[#E8DCC8] text-[#6B5D52]"
              }`}
            >
              {status === "ASSIGNED" ? "Ready for Pickup" : status === "PICKED_UP" ? "In Transit" : "Delivered"}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#6B5D52] uppercase tracking-wider mb-1">Customer Name</p>
            <h3 className="text-lg font-medium text-[#2C1810]">{order.customerName ?? "Walk-in Customer"}</h3>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#6B5D52] uppercase tracking-wider mb-1">Phone Number</p>
            <div className="flex items-center justify-between">
              <p className="text-[#2C1810]">{order.customerPhone}</p>
              <button
                onClick={handleCallCustomer}
                className="bg-[#2C1810] text-[#D4A574] px-4 py-2 rounded-lg hover:bg-[#3A2618] transition-colors flex items-center gap-2 font-medium"
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#6B5D52] uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Delivery Address
            </p>
            <p className="mb-3 text-[#2C1810]">{order.deliveryAddress}</p>
            <button
              onClick={handleOpenMaps}
              className="w-full bg-[#6B4423] text-[#FBF8F3] px-4 py-3 rounded-lg hover:bg-[#3A2618] transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              Navigate to Customer
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E8DCC8] shadow-sm mb-4 p-4">
        <h3 className="mb-3 text-lg font-semibold text-[#2C1810]">Order Items</h3>
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-2 border-b border-[#E8DCC8] last:border-0 text-[#2C1810]">
              <span>
                {item.quantity}x {item.menuItem.name}
              </span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold text-[#2C1810]">
            <span>Total Amount</span>
            <span className="text-[#B85C3E]">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#FBF8F3] rounded-xl border border-[#E8DCC8] p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B5D52] uppercase tracking-wider">Delivery Status</p>
            <p className="text-[#2C1810] font-medium mt-1">{status.replace("_", " ")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-[#6B5D52] uppercase tracking-wider">Delivery Fee</p>
            <p className="text-[#B85C3E] font-bold mt-1">{formatCurrency(order.deliveryFee)}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => printCustomerSaleBill(order)}
        className="w-full bg-white border-2 border-[#D4A574] text-[#2C1810] px-6 py-3 rounded-lg hover:bg-[#FBF8F3] transition-colors flex items-center justify-center gap-2 mb-3 font-medium"
      >
        <Printer className="w-5 h-5" />
        Print customer bill (58mm)
      </button>

      {status === "ASSIGNED" && (
        <button
          onClick={() => void handlePickup()}
          className="w-full bg-[#D4A574] text-[#2C1810] px-6 py-4 rounded-lg hover:bg-[#C39360] transition-colors flex items-center justify-center gap-2 mb-3 font-bold shadow-md"
        >
          <Package className="w-5 h-5" />
          Mark as Picked Up
        </button>
      )}

      {status === "PICKED_UP" && (
        <button
          onClick={() => void handleMarkDelivered()}
          className="w-full bg-[#B85C3E] text-[#FBF8F3] px-6 py-4 rounded-lg hover:bg-[#8A432D] transition-colors flex items-center justify-center gap-2 font-bold shadow-md"
        >
          <CheckCircle className="w-5 h-5" />
          Mark as Delivered
        </button>
      )}
    </div>
  );
}
