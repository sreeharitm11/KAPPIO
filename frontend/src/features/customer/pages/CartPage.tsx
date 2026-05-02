import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Minus, Trash2, ShoppingBag, MessageSquare, CheckCircle2 } from "lucide-react";
import { orderStore } from "../../orders/store/orderStore";
import { formatCurrency } from "../../../shared/lib/format";

export default function CartPage() {
  const [cartItems, setCartItems] = useState(orderStore.getOrder().items);
  const [specialInstructions, setSpecialInstructions] = useState(orderStore.getOrder().specialInstructions);
  const [tableNumber, setTableNumber] = useState(orderStore.getOrder().tableNumber || "");
  const currentOrder = useMemo(() => orderStore.getOrder(), [cartItems, specialInstructions, tableNumber]);

  const updateQuantity = (menuItemId: string, delta: number) => {
    const existing = cartItems.find((item) => item.menuItemId === menuItemId);
    if (!existing) return;

    orderStore.updateQuantity(menuItemId, Math.max(0, existing.quantity + delta));
    setCartItems([...orderStore.getOrder().items]);
  };

  const removeItem = (menuItemId: string) => {
    orderStore.removeItem(menuItemId);
    setCartItems([...orderStore.getOrder().items]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleProceedToCheckout = () => {
    orderStore.updateOrder({
      items: cartItems,
      specialInstructions,
      tableNumber,
      status: "pending"
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-white rounded-2xl p-12 border-2 border-[#E8DCC8] shadow-lg">
          <ShoppingBag className="w-20 h-20 mx-auto mb-4 text-[#D4A574]" />
          <h2 className="mb-2 text-[#2C1810]">Your cart is empty</h2>
          <p className="text-[#6B5D52] mb-6">Add some delicious items to get started</p>
          <Link
            to="/menu"
            className="inline-block bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-[#2C1810]">Your Cart</h1>
        <p className="text-[#6B5D52] mt-1">{cartItems.length} items ready to order</p>
      </div>

      <div className="space-y-4 mb-6">
        {cartItems.map((item) => (
          <div key={item.menuItemId} className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-5 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F4E8D8] to-[#E8DCC8] rounded-xl flex items-center justify-center text-4xl overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  "🍽️"
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[#2C1810] pr-2">{item.name}</h3>
                  <div 
                    className={`flex-shrink-0 w-3 h-3 border-2 p-[1px] flex items-center justify-center rounded-[1px] ${
                      item.isVeg ? 'border-green-600' : 'border-red-600'
                    }`}
                  >
                    <div className={`w-full h-full rounded-full ${
                      item.isVeg ? 'bg-green-600' : 'bg-red-600'
                    }`} />
                  </div>
                </div>
                <p className="text-[#B85C3E] mb-3 text-lg">{formatCurrency(item.price)}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-[#F4E8D8] rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4 text-[#2C1810]" />
                    </button>
                    <span className="w-8 text-center text-[#2C1810]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#2C1810]" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.menuItemId)}
                    className="text-[#C14953] hover:text-[#A03A42] p-2 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-6 mb-4 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-[#B85C3E]" />
          <h3 className="text-[#2C1810]">Order Details</h3>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#6B5D52] mb-1">Table Number (optional)</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g. Table 5"
            className="w-full px-4 py-2 border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent bg-[#FBF8F3] text-[#2C1810]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B5D52] mb-1">Special Instructions</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any special requests? (e.g., extra hot, less sugar, no ice...)"
            rows={3}
            className="w-full px-4 py-3 border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent resize-none bg-[#FBF8F3] text-[#2C1810] placeholder:text-[#6B5D52]"
          />
        </div>
        {currentOrder.commentAcknowledged && (
          <div className="mt-3 flex items-center gap-2 bg-[#6B9B8F]/10 border border-[#6B9B8F]/30 rounded-lg px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-[#6B9B8F]" />
            <p className="text-sm text-[#6B9B8F]">Kappio Café has acknowledged your request!</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-6 mb-6 shadow-md">
        <h3 className="mb-4 text-[#2C1810]">Bill Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-[#6B5D52]">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#6B5D52]">
            <span>Delivery Fee</span>
            <span className="text-sm italic">Calculated at checkout</span>
          </div>
          <div className="border-t-2 border-[#E8DCC8] pt-3 flex justify-between">
            <span className="text-[#2C1810]">Subtotal</span>
            <span className="text-[#B85C3E] text-xl">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>

      <Link
        to="/checkout"
        onClick={handleProceedToCheckout}
        className="w-full bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-6 py-5 rounded-2xl hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-lg hover:scale-105"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
