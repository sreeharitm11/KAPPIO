import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Phone, MapPin, Navigation, CheckCircle, Package, Printer } from "lucide-react";
import { fetchOrderById } from "../../orders/api/ordersApi";
import { collectCodPayment, updateDeliveryStatus } from "../api/deliveryApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { Order } from "../../../shared/types/api";
import { buildMergedBillHtml, openThermalPrint, printCustomerSaleBill } from "../../../shared/lib/thermal-receipt";

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
        <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-8 text-center shadow-md">
          <h2 className="text-[#2C1810] text-xl font-bold">{error ?? "Order not found"}</h2>
        </div>
      </div>
    );
  }

  const handleCallCustomer = () => {
    window.location.href = `tel:${order.customerPhone}`;
  };

  const specialInstructions = order.specialInstructions || "";
  const locationMatch = specialInstructions.match(/Location: ([-\d.]+,[-\d.]+)/);
  const locationCoords = locationMatch ? locationMatch[1] : null;
  const commentsOnly = specialInstructions.replace(/Location: [-\d.]+,[-\d.]+/, '').trim();

  const handleOpenMaps = () => {
    if (locationCoords) {
      window.open(`https://mappls.com/?q=${locationCoords}`, "_blank");
    } else {
      const encodedAddress = encodeURIComponent(order.deliveryAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
    }
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

      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-md mb-6 overflow-hidden">
        <div className="p-5 border-b-2 border-[#E8DCC8] bg-[#FBF8F3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-[#D4A574]" />
              <span className="font-bold text-[#2C1810] text-lg">Order Status</span>
            </div>
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                status === "ASSIGNED"
                  ? "bg-[#E8DCC8] text-[#6B4423]"
                  : status === "PICKED_UP"
                  ? "bg-[#D4A574] text-[#2C1810]"
                  : "bg-white border-2 border-[#E8DCC8] text-[#6B5D52]"
              }`}
            >
              {status === "ASSIGNED" ? "Ready for Pickup" : status === "PICKED_UP" ? "In Transit" : "Delivered"}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-[#D4A574] uppercase tracking-wider mb-1">Customer Name</p>
            <h3 className="text-xl font-bold text-[#2C1810]">{order.customerName ?? "Walk-in Customer"}</h3>
          </div>

          <div>
            <p className="text-xs font-bold text-[#D4A574] uppercase tracking-wider mb-1">Phone Number</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium text-[#2C1810]">{order.customerPhone}</p>
              <button
                onClick={handleCallCustomer}
                className="bg-[#2C1810] text-[#D4A574] px-5 py-2.5 rounded-xl hover:bg-[#3A2618] transition-colors flex items-center gap-2 font-bold shadow-md hover:-translate-y-0.5"
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[#D4A574] uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </p>
            <p className="mb-4 text-lg text-[#2C1810]">{order.deliveryAddress}</p>
            <button
              onClick={handleOpenMaps}
              className="w-full bg-[#6B4423] text-[#FBF8F3] px-5 py-3.5 rounded-xl hover:bg-[#3A2618] transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-md hover:-translate-y-0.5"
            >
              <Navigation className="w-5 h-5" />
              {locationCoords ? "Navigate via Mappls (Live)" : "Navigate via Google Maps"}
            </button>
          </div>

          {commentsOnly && (
            <div className="bg-[#F4E8D8] rounded-xl p-4 mt-4 border-l-4 border-[#B85C3E]">
              <p className="text-xs font-bold text-[#B85C3E] uppercase tracking-wider mb-1">Customer Instructions</p>
              <p className="text-[#2C1810] font-medium">"{commentsOnly}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-md mb-6 p-5">
        <h3 className="mb-4 text-xl font-bold text-[#2C1810]">Order Items</h3>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-base py-3 border-b-2 border-[#E8DCC8] last:border-0 text-[#2C1810]">
              <span className="font-medium">
                {item.quantity}x {item.menuItem.name}
              </span>
              <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 font-bold text-xl text-[#2C1810]">
            <span>Total Amount</span>
            <span className="text-[#B85C3E]">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#FBF8F3] rounded-2xl border-2 border-[#E8DCC8] p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#D4A574] uppercase tracking-wider">Delivery Status</p>
            <p className="text-[#2C1810] font-bold text-lg mt-1">{status.replace("_", " ")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#D4A574] uppercase tracking-wider">Delivery Fee</p>
            <p className="text-[#B85C3E] font-bold text-lg mt-1">{formatCurrency(order.deliveryFee)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => printCustomerSaleBill(order)}
          className="bg-white border-2 border-[#E8DCC8] text-[#2C1810] px-4 py-4 rounded-xl hover:bg-[#FBF8F3] hover:border-[#D4A574] transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-sm"
        >
          <Printer className="w-4 h-4 text-[#D4A574]" />
          Bill Only
        </button>
        <button
          type="button"
          onClick={() => openThermalPrint(buildMergedBillHtml(order))}
          className="bg-white border-2 border-[#D4A574] text-[#2C1810] px-4 py-4 rounded-xl hover:bg-[#FBF8F3] transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-sm"
        >
          <Printer className="w-4 h-4 text-[#B85C3E]" />
          KOT + Bill
        </button>
      </div>

      {status === "ASSIGNED" && (
        <button
          onClick={() => void handlePickup()}
          className="w-full bg-gradient-to-r from-[#D4A574] to-[#C39360] text-[#2C1810] px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mb-4 font-bold shadow-md hover:-translate-y-1"
        >
          <Package className="w-6 h-6" />
          Mark as Picked Up
        </button>
      )}

      {status === "PICKED_UP" && (
        <button
          onClick={() => void handleMarkDelivered()}
          className="w-full bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-md hover:-translate-y-1"
        >
          <CheckCircle className="w-6 h-6" />
          Mark as Delivered
        </button>
      )}
    </div>
  );
}
