"use client";

import { useState } from "react";
import { useRemotePosStore } from "@/lib/stores/remote-pos-store";
import {
  useRemoteLocations,
  useSubmitRemoteOrder,
  useRemoteOrderHistory,
} from "@/lib/hooks/use-remote-pos";
import { OrderItemRow } from "@/components/pos/caja/order-item-row";
import {
  MapPin,
  User,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Truck,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  sent: { label: "Enviado", color: "text-blue-600 bg-blue-50" },
  confirmed: { label: "Confirmado", color: "text-green-600 bg-green-50" },
  rejected: { label: "Rechazado", color: "text-red-600 bg-red-50" },
  ready: { label: "Listo", color: "text-amber-600 bg-amber-50" },
  closed: { label: "Cerrado", color: "text-gray-500 bg-gray-100" },
  error: { label: "Error", color: "text-red-600 bg-red-50" },
};

export function RemoteOrderPanel() {
  const [showComment, setShowComment] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const order = useRemotePosStore((s) => s.order);
  const location = useRemotePosStore((s) => s.location);
  const customerName = useRemotePosStore((s) => s.customer_name);
  const customerPhone = useRemotePosStore((s) => s.customer_phone);
  const comment = useRemotePosStore((s) => s.comment);
  const grandTotal = useRemotePosStore((s) => s.grandTotal);
  const removeItem = useRemotePosStore((s) => s.removeItem);
  const updateItemQuantity = useRemotePosStore((s) => s.updateItemQuantity);
  const clearOrder = useRemotePosStore((s) => s.clearOrder);
  const setLocation = useRemotePosStore((s) => s.setLocation);
  const setCustomerName = useRemotePosStore((s) => s.setCustomerName);
  const setCustomerPhone = useRemotePosStore((s) => s.setCustomerPhone);
  const setComment = useRemotePosStore((s) => s.setComment);

  const { data: locations } = useRemoteLocations();
  const { data: history, refetch: refetchHistory } = useRemoteOrderHistory();
  const submitOrder = useSubmitRemoteOrder();

  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  const deliveryFee = location?.delivery_fee || 0;

  const canSubmit =
    order.items.length > 0 &&
    location &&
    customerName.trim().length > 0;

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = locations?.find((l) => l.id === e.target.value);
    if (loc) {
      setLocation({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        delivery_fee: loc.delivery_fee,
      });
    } else {
      setLocation(null);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !location) return;

    try {
      const result = await submitOrder.mutateAsync({
        location_id: location.id,
        items: order.items,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        comment: comment.trim() || undefined,
        total: order.total,
      });

      setSuccessMsg(`Pedido #${result.fudo_order_id} enviado`);
      clearOrder();
      refetchHistory();
      setConfirmOpen(false);

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      // Error is handled by submitOrder.error
      setConfirmOpen(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-center px-3 py-3 border-b border-gray-200">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" />
          Delivery Bares
        </span>
      </div>

      {/* Location + Customer form */}
      <div className="px-3 py-2 space-y-2 border-b border-gray-100">
        {/* Location selector */}
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={location?.id || ""}
            onChange={handleLocationChange}
            className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 appearance-none"
          >
            <option value="">Seleccionar punto...</option>
            {locations?.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Address (read-only) */}
        {location && (
          <p className="text-[10px] text-gray-400 font-medium px-1 truncate">
            {location.address}
          </p>
        )}

        {/* Customer name */}
        <div className="relative">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Nombre cliente *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-gray-400 placeholder:font-medium"
          />
        </div>

        {/* Customer phone */}
        <div className="relative">
          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="tel"
            placeholder="Telefono"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-gray-400 placeholder:font-medium"
          />
        </div>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComment(!showComment)}
          className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <MessageSquare className="w-3 h-3" />
          {showComment ? "Ocultar nota" : "Agregar nota"}
        </button>

        {showComment && (
          <textarea
            placeholder="Instrucciones especiales..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={254}
            className="w-full px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-gray-400 resize-none"
          />
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {order.items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-300 text-sm">
            Agrega productos
          </div>
        ) : (
          order.items.map((item) => (
            <OrderItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
              onRemove={() => removeItem(item.id)}
            />
          ))
        )}
      </div>

      {/* Success / Error banners */}
      {successMsg && (
        <div className="mx-3 mb-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700">{successMsg}</span>
        </div>
      )}
      {submitOrder.error && (
        <div className="mx-3 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-xs font-bold text-red-700 truncate">
            {submitOrder.error.message}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 space-y-3">
        <div className="flex justify-between text-gray-400 text-xs">
          <span>{totalItems} items</span>
          <span className="tabular-nums">{order.items.length} productos</span>
        </div>

        {/* Subtotal + delivery fee */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span className="font-bold tabular-nums">
              ${(order.total ?? 0).toLocaleString()}
            </span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Delivery</span>
              <span className="font-bold tabular-nums">
                ${deliveryFee.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xl font-extrabold text-gray-900">Total</span>
          <span className="text-3xl font-extrabold text-gray-900 tabular-nums">
            ${grandTotal().toLocaleString()}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearOrder}
            disabled={order.items.length === 0}
            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-500 text-sm font-extrabold uppercase tracking-wider hover:border-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg"
          >
            Limpiar
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!canSubmit || submitOrder.isPending}
            className="flex-[2] py-3.5 bg-emerald-600 border-2 border-emerald-600 text-white text-sm font-extrabold uppercase tracking-wider hover:bg-emerald-700 hover:border-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg flex items-center justify-center gap-2"
          >
            {submitOrder.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            Enviar
          </button>
        </div>
      </div>

      {/* Mini History */}
      <div className="border-t border-gray-100 max-h-[120px] overflow-y-auto">
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            Recientes
          </span>
        </div>
        {(!history || history.length === 0) ? (
          <div className="text-center text-gray-300 text-[11px] py-2">
            Sin pedidos recientes
          </div>
        ) : (
          history.slice(0, 6).map((o) => {
            const time = new Date(o.created_at).toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const st = STATUS_LABELS[o.status] || STATUS_LABELS.sent;
            return (
              <div key={o.id} className="px-3 py-1.5 flex items-center gap-2 text-[11px]">
                <span className="text-gray-400 tabular-nums shrink-0">{time}</span>
                <span className="font-extrabold text-gray-900 tabular-nums shrink-0">
                  ${Number(o.total).toLocaleString()}
                </span>
                <span className="text-gray-400 font-medium truncate">
                  {o.customer_name}
                </span>
                <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0", st.color)}>
                  {st.label}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm dialog overlay */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-[380px] max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900">Confirmar Pedido</h3>
              <p className="text-xs text-gray-500 mt-1">Se enviara a Fudo como delivery</p>
            </div>

            <div className="p-5 space-y-3">
              {/* Location */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{location?.name}</p>
                  <p className="text-xs text-gray-500">{location?.address}</p>
                </div>
              </div>

              {/* Customer */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-900">{customerName}</span>
                {customerPhone && (
                  <span className="text-xs text-gray-400 ml-1">{customerPhone}</span>
                )}
              </div>

              {/* Items summary */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-gray-700 font-medium truncate">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-gray-900 font-bold tabular-nums shrink-0 ml-2">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold tabular-nums">${(order.total ?? 0).toLocaleString()}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Delivery</span>
                    <span className="font-bold tabular-nums">${deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span className="tabular-nums">${grandTotal().toLocaleString()}</span>
                </div>
              </div>

              {comment.trim() && (
                <p className="text-xs text-gray-500 italic">
                  Nota: {comment}
                </p>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitOrder.isPending}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 text-sm font-extrabold uppercase tracking-wider hover:border-gray-400 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitOrder.isPending}
                className="flex-[2] py-3 bg-emerald-600 border-2 border-emerald-600 text-white text-sm font-extrabold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitOrder.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {submitOrder.isPending ? "Enviando..." : "Confirmar Envio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
