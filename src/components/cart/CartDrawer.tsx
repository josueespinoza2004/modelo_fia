'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { submitOrder, validateCoupon } from '@/lib/api';
import { CartItem, OrderConfirmationResponse } from '@/types/coffee';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    updateGrind,
    totalPrice,
    totalItems,
    clearCart,
    openSommelierWithCoffee,
  } = useCart();
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmationResponse | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountRate, setDiscountRate] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  const freeShippingThreshold = 55.0;
  const discountAmount = totalPrice * discountRate;
  const subtotalAfterDiscount = totalPrice - discountAmount;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalAfterDiscount);
  const shippingProgress = Math.min(100, (subtotalAfterDiscount / freeShippingThreshold) * 100);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await validateCoupon(code, totalPrice);
      if (res.valid && res.code) {
        setAppliedCoupon(res.code);
        setDiscountRate(res.discountRate);
        setCouponInput('');
      } else {
        setCouponError(res.message || 'Cupón inválido');
      }
    } catch {
      setCouponError('No se pudo validar el cupón con el servidor');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    setOrderError('');
    try {
      const res = await submitOrder({
        email: customerEmail,
        couponCode: appliedCoupon,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          grindOption: item.grindOption,
        })),
      });
      if (res.success && res.orderNumber) {
        setOrderConfirmation(res);
        setCheckoutSuccess(true);
        setAppliedCoupon(null);
        setDiscountRate(0);
        clearCart();
      } else {
        setOrderError(res.error || 'No se pudo procesar el pedido');
      }
    } catch {
      setOrderError('Error de conexión con el servidor Python al procesar el pedido.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-[#120e0c] border-l border-amber-600/30 text-zinc-100 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cart-drawer-title" className="font-serif text-lg font-bold text-amber-100">
                    Tu Cesta de Café Fresco
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {totalItems} {totalItems === 1 ? 'paquete' : 'paquetes'} seleccionados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Bar */}
            <div className="bg-amber-950/30 border-b border-amber-500/10 px-6 py-3">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-zinc-300 font-medium">
                  {remainingForFreeShipping > 0
                    ? `Te faltan $${remainingForFreeShipping.toFixed(2)} para Envío Gratis`
                    : '🎉 ¡Tienes Envío Gratis Despachado en 24h!'}
                </span>
                <span className="text-amber-400 font-bold">{Math.round(shippingProgress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 rounded-full"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-400">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif text-lg text-zinc-200 font-semibold mb-1">
                    Tu cesta está vacía
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mb-6">
                    Explora nuestros microlotes o pregúntale a Don Aurelio para recomendarte tu café según tu método preferido.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button
                      onClick={() => setIsCartOpen(false)}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-full px-5 cursor-pointer"
                    >
                      Ver Colección de Cafés
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCartOpen(false);
                        openSommelierWithCoffee(undefined, 'quiz');
                      }}
                      className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 rounded-full px-5 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Test de Paladar</span>
                    </Button>
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.grindOption}`}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-amber-500/30 transition-all flex gap-3.5"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-18 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-sm font-semibold text-zinc-100 truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.product.id, item.grindOption)}
                            className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Editable Grind Option inside Cart */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <select
                            value={item.grindOption}
                            onChange={(e) =>
                              updateGrind(
                                item.product.id,
                                item.grindOption,
                                e.target.value as CartItem['grindOption']
                              )
                            }
                            aria-label={`Cambiar molienda de ${item.product.name}`}
                            className="text-[10px] bg-zinc-950 border border-amber-500/30 text-amber-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-400"
                          >
                            <option value="Grano Entero">Grano Entero</option>
                            <option value="Molienda Media (V60 / Filtro)">
                              Molienda Media (V60 / Filtro)
                            </option>
                            <option value="Molienda Fina (Espresso)">
                              Molienda Fina (Espresso)
                            </option>
                            <option value="Molienda Gruesa (Prensa Francesa)">
                              Molienda Gruesa (Prensa Francesa)
                            </option>
                          </select>
                          <span className="text-[11px] text-zinc-400">{item.product.weightGrams}g</span>
                        </div>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-zinc-700 rounded-lg bg-zinc-950/60 overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.grindOption, item.quantity - 1)
                            }
                            aria-label="Disminuir cantidad"
                            className="p-1 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-zinc-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.grindOption, item.quantity + 1)
                            }
                            aria-label="Aumentar cantidad"
                            className="p-1 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-semibold text-sm text-amber-400">
                          ${(item.product.price * item.quantity).toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="p-6 border-t border-zinc-800 bg-[#0d0a09] space-y-4">
                {/* Discount Coupon Row */}
                <div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Tag className="w-3.5 h-3.5" /> Cupón <strong>{appliedCoupon}</strong> (-
                        {Math.round(discountRate * 100)}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setDiscountRate(0);
                        }}
                        className="text-zinc-400 hover:text-white text-[11px] cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError('');
                          }}
                          placeholder="Código de descuento (ej. AURA15)"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          disabled={isValidatingCoupon}
                          onClick={handleApplyCoupon}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {isValidatingCoupon ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-red-400 pl-1">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Subtotal de café</span>
                    <span className="text-zinc-200 font-medium">${totalPrice.toFixed(2)} USD</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuento Club AURA ({Math.round(discountRate * 100)}%)</span>
                      <span className="font-medium">-${discountAmount.toFixed(2)} USD</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Envío exprés 48h</span>
                    <span className="text-zinc-200 font-medium">
                      {remainingForFreeShipping === 0 ? (
                        <span className="text-emerald-400 font-semibold">GRATIS</span>
                      ) : (
                        '$4.50 USD'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-zinc-100 pt-2 border-t border-zinc-800">
                    <span>Total Estimado</span>
                    <span className="text-amber-400 font-serif">
                      $
                      {(
                        subtotalAfterDiscount + (remainingForFreeShipping === 0 ? 0 : 4.5)
                      ).toFixed(2)}{' '}
                      USD
                    </span>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Ingresa tu correo para el despacho..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 placeholder:text-zinc-500"
                  />

                  {orderError && (
                    <p className="text-[11px] text-red-400">{orderError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmittingOrder}
                    id="checkout-confirm-btn"
                    className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-zinc-950 font-bold py-3 rounded-xl shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <span>
                      {isSubmittingOrder ? 'Procesando en el servidor...' : 'Finalizar Pedido de Café'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <p className="text-[10px] text-center text-zinc-500">
                  🔒 Pago encriptado de 256 bits. Tueste garantizado menor a 7 días.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Dialog Modal */}
      <Dialog open={checkoutSuccess} onOpenChange={setCheckoutSuccess}>
        <DialogContent className="bg-zinc-950 border-amber-600/40 text-zinc-100 max-w-md">
          <DialogHeader>
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="font-serif text-2xl text-center text-amber-100">
              ¡Tu Pedido de Café está en Camino al Tostador!
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-400 text-sm mt-2">
              Hemos enviado la confirmación y la guía de tueste fresco a{' '}
              <strong className="text-amber-400">{customerEmail}</strong>. Tus granos serán
              empaquetados en bolsa con válvula desgasificadora unidireccional.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 space-y-1.5 my-2">
            <div className="flex justify-between">
              <span className="text-zinc-500">Número de lote:</span>
              <span className="font-mono text-amber-400">
                {orderConfirmation?.orderNumber || '#AURA-2026'}
              </span>
            </div>
            {orderConfirmation?.total !== undefined && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Total confirmado:</span>
                <span className="font-semibold text-amber-300">
                  ${orderConfirmation.total.toFixed(2)} USD
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Fecha de tueste:</span>
              <span>{orderConfirmation?.roastDate || 'Esta semana (Frescura pico)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Despacho garantizado:</span>
              <span>{orderConfirmation?.estimatedDispatch || '48 horas'}</span>
            </div>
          </div>

          <Button
            onClick={() => {
              setCheckoutSuccess(false);
              setIsCartOpen(false);
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl py-2.5 mt-2 cursor-pointer"
          >
            Continuar Descubriendo Cafés
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
