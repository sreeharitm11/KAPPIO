import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../../../shared/lib/api-client';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

export default function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/track/${orderNumber}`)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) return <div className="p-8 text-center">Loading status...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  const steps = [
    { key: 'PENDING', label: 'Order Received', icon: Clock },
    { key: 'PREPARING', label: 'Preparing', icon: Package },
    { key: 'PICKED_UP', label: 'Out for Delivery', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ];

  const currentIndex = steps.findIndex(s => s.key === order.status || (order.deliveryStatus === s.key));

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#2C1810]">Track Order #{orderNumber}</h1>
      
      <div className="space-y-8 relative before:absolute before:left-[1.65rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8DCC8]">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={step.key} className="flex items-center gap-6 relative z-10">
              <div className={`p-3 rounded-full ${isDone ? 'bg-[#D4A574] text-white' : 'bg-white border-2 border-[#E8DCC8] text-[#9E8E81]'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className={`font-bold ${isCurrent ? 'text-[#B85C3E] text-lg' : 'text-[#2C1810]'}`}>
                  {step.label}
                </p>
                {isCurrent && <p className="text-sm text-[#6B5D52]">Current Status</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-[#FDF8F3] rounded-2xl border-2 border-[#E8DCC8]">
        <h3 className="font-bold text-[#2C1810] mb-2">Order Details</h3>
        <p className="text-sm text-[#6B5D52]">Items: {order.items.length}</p>
        <p className="text-sm text-[#6B5D52]">Delivery Address: {order.deliveryAddress}</p>
      </div>
    </div>
  );
}
