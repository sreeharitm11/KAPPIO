import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CheckCircle, Home, Coffee, Printer } from "lucide-react";
import { trackOrder } from "../../orders/api/ordersApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { Order } from "../../../shared/types/api";
import { printCustomerSaleBill } from "../../../shared/lib/thermal-receipt";
import { useSearchParams } from "react-router";
import { Smartphone } from "lucide-react";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showQr = searchParams.get("showQr") === "true";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const load = async () => {
      try {
        const response = await trackOrder(orderId);
        setOrder(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load order");
      }
    };

    void load();
  }, [orderId]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-8 text-center shadow-xl">
        <div className="w-24 h-24 bg-gradient-to-br from-[#6B9B8F] to-[#4A7C71] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-14 h-14 text-white" />
        </div>

        <h1 className="mb-2 text-[#2C1810]">Order Confirmed!</h1>
        <p className="text-[#6B5D52] mb-6">
          {error ? error : "Your order has been placed successfully at Kappio Café"}
        </p>

        <div className="bg-gradient-to-br from-[#F4E8D8] to-[#E8DCC8] rounded-2xl p-6 mb-6">
          <p className="text-sm text-[#6B5D52] mb-2">Order ID</p>
          <h2 className="text-[#B85C3E] mb-4">#{orderId}</h2>

          <div className="border-t-2 border-[#D4A574]/30 pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B5D52]">Estimated Delivery</span>
              <span className="text-[#2C1810]">{order?.estimatedDeliveryMinutes ?? 30} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B5D52]">Total Amount</span>
              <span className="text-[#B85C3E]">{order ? formatCurrency(order.totalAmount) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B5D52]">Payment Method</span>
              <span className="text-[#2C1810]">{showQr ? "UPI Online" : "Cash on Delivery"}</span>
            </div>
          </div>
        </div>

        {showQr && order && (
          <div className="mb-8 p-6 bg-white border-2 border-[#D4A574] rounded-3xl shadow-inner">
            <h3 className="text-[#2C1810] mb-4 font-bold">Scan to Pay via UPI</h3>
            <div className="flex justify-center mb-6">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=Q06322913@ybl&pn=Kappio%20Cafe&am=${order.totalAmount}&cu=INR&tn=Order%20${order.orderNumber}`)}`}
                alt="UPI QR Code"
                className="w-48 h-48 border-4 border-white shadow-lg rounded-2xl"
              />
            </div>
            <a
              href={`upi://pay?pa=Q06322913@ybl&pn=Kappio%20Cafe&am=${order.totalAmount}&cu=INR&tn=Order%20${order.orderNumber}`}
              className="w-full bg-[#2C1810] text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#3D2418] transition-all"
            >
              <Smartphone className="w-5 h-5" />
              Open in UPI App
            </a>
            <p className="text-[10px] text-[#6B5D52] mt-4 uppercase tracking-widest font-bold">
              Pay via GPay, PhonePe, or Paytm
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="bg-[#6B9B8F]/10 border-2 border-[#6B9B8F]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Coffee className="w-5 h-5 text-[#6B9B8F]" />
              <p className="text-sm text-[#2C1810]">
                Your order is being prepared with care
              </p>
            </div>
            <p className="text-xs text-[#6B5D52]">
              You will receive updates via SMS and app notifications
            </p>
          </div>

          <Link
            to="/menu"
            className="w-full bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Back to Menu
          </Link>

          <button
            onClick={() => navigate(`/confirmation/${orderId}`)}
            className="w-full border-2 border-[#E8DCC8] px-6 py-4 rounded-xl hover:bg-[#F4E8D8] transition-colors text-[#2C1810]"
          >
            Track Order
          </button>

          {order && (
            <button
              type="button"
              onClick={() => printCustomerSaleBill(order)}
              className="w-full border-2 border-[#D4A574] px-6 py-4 rounded-xl hover:bg-[#F4E8D8] transition-colors text-[#2C1810] flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print receipt (58mm thermal)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
