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
  Compass,
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
        setCouponError(res.message || 'Cupón no válido');
      }
    } catch {
      setCouponError('No se pudo validar el cupón con el servidor');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsSubmittingOrder(true);
    setOrderError('');
    try {
      const confirmation = await submitOrder({
        email: customerEmail.trim(),
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          grindOption: i.grindOption,
        })),
        couponCode: appliedCoupon || undefined,
      });

      setOrderConfirmation(confirmation);
      clearCart();
      setCheckoutSuccess(true);
    } catch {
      setOrderError('Hubo un inconveniente al registrar el pedido en el servidor. Intenta de nuevo.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!isCartOpen && !checkoutSuccess) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 overflow-hidden ${!isCartOpen ? 'pointer-events-none' : ''}`}
        aria-labelledby="cart-drawer-title"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-[#fbf9f5] border-l border-[#ded4c5] text-[#29211b] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-[#e6dfd4] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#f2ece2] text-[#8f461e] border border-[#ded5c6]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cart-drawer-title" className="font-serif text-lg font-bold text-[#261f1a]">
                    Tu Cesta de Café Fresco
                  </h3>
                  <p className="text-xs text-[#736355]">
                    {totalItems} {totalItems === 1 ? 'paquete' : 'paquetes'} seleccionados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-lg text-[#78695c] hover:text-[#261f1a] hover:bg-[#f2ece2] transition-colors cursor-pointer"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Bar */}
            <div className="bg-[#f5efe7] border-b border-[#e2d6c6] px-6 py-3">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-[#524438] font-medium">
                  {remainingForFreeShipping > 0
                    ? `Te faltan $${remainingForFreeShipping.toFixed(2)} para Envío Gratis`
                    : '🎉 ¡Tienes Envío Gratis Despachado en 24h!'}
                </span>
                <span className="text-[#8f461e] font-bold">{Math.round(shippingProgress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#e4dacb] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8f461e] transition-all duration-500 rounded-full"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[#736355]">
                  <div className="w-16 h-16 rounded-full bg-white border border-[#ded5c6] flex items-center justify-center text-[#998b7d] mb-4 shadow-xs">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif text-lg text-[#261f1a] font-semibold mb-1">
                    Tu cesta está vacía
                  </h4>
                  <p className="text-xs text-[#6e5f52] max-w-xs mb-6">
                    Explora nuestros microlotes o consulta a Don Aurelio para recomendarte tu café según tu cafetera preferida.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button
                      onClick={() => setIsCartOpen(false)}
                      className="bg-[#8f461e] hover:bg-[#783916] text-white font-medium rounded-full px-5 cursor-pointer shadow-xs border border-[#783916]"
                    >
                      Ver Cafés de Temporada
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCartOpen(false);
                        openSommelierWithCoffee(undefined, 'quiz');
                      }}
                      className="border-[#ded5c6] text-[#4f4134] hover:bg-[#f6f1e9] rounded-full px-5 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#8f461e]" />
                      <span>Test de Paladar</span>
                    </Button>
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.grindOption}`}
                    className="p-3.5 rounded-xl bg-white border border-[#e2d8ca] shadow-xs flex gap-3.5"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-18 h-20 rounded-lg overflow-hidden shrink-0 bg-[#f0e9df] border border-[#ded5c6]">
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
                          <h4 className="text-sm font-semibold text-[#261f1a] truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.product.id, item.grindOption)}
                            className="text-[#998b7d] hover:text-red-600 transition-colors p-1 cursor-pointer"
                            title="Eliminar café"
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
                            className="text-[10px] bg-[#faf7f2] border border-[#ded5c6] text-[#29211b] rounded px-1.5 py-0.5 focus:outline-none focus:border-[#8f461e]"
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
                          <span className="text-[11px] text-[#736355]">{item.product.weightGrams}g</span>
                        </div>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-[#ded5c6] rounded-lg bg-[#faf7f2] overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.grindOption, item.quantity - 1)
                            }
                            aria-label="Disminuir cantidad"
                            className="p-1 hover:bg-[#ede5d8] text-[#524438] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-[#261f1a]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.grindOption, item.quantity + 1)
                            }
                            aria-label="Aumentar cantidad"
                            className="p-1 hover:bg-[#ede5d8] text-[#524438] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-serif font-bold text-sm text-[#261f1a]">
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
              <div className="p-6 border-t border-[#e6dfd4] bg-white space-y-4">
                {/* Discount Coupon Row */}
                <div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#eef7ee] border border-[#cbe4cc] text-xs text-[#2b6634]">
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
                        className="text-[#756658] hover:text-[#261f1a] text-[11px] cursor-pointer"
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
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#faf7f2] border border-[#ded5c6] text-xs text-[#29211b] placeholder:text-[#998b7d] focus:outline-none focus:border-[#8f461e]"
                        />
                        <button
                          type="button"
                          disabled={isValidatingCoupon}
                          onClick={handleApplyCoupon}
                          className="px-3 py-1.5 rounded-lg bg-[#f2ece2] hover:bg-[#e8dec0] text-[#705642] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 border border-[#ded5c6]"
                        >
                          {isValidatingCoupon ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-red-600 pl-1">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-[#706154]">
                  <div className="flex justify-between">
                    <span>Subtotal de café</span>
                    <span className="text-[#261f1a] font-medium">${totalPrice.toFixed(2)} USD</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#2b6634]">
                      <span>Descuento Club AURA ({Math.round(discountRate * 100)}%)</span>
                      <span className="font-medium">-${discountAmount.toFixed(2)} USD</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Envío exprés 48h</span>
                    <span className="text-[#261f1a] font-medium">
                      {remainingForFreeShipping === 0 ? (
                        <span className="text-[#2b6634] font-semibold">GRATIS</span>
                      ) : (
                        '$4.50 USD'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#261f1a] pt-2 border-t border-[#eee7dd]">
                    <span>Total Estimado</span>
                    <span className="text-[#8f461e] font-serif text-lg">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7f2] border border-[#ded5c6] text-sm text-[#29211b] focus:outline-none focus:border-[#8f461e] placeholder:text-[#998b7d]"
                  />

                  {orderError && (
                    <p className="text-[11px] text-red-600">{orderError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmittingOrder}
                    id="checkout-confirm-btn"
                    className="w-full bg-[#8f461e] hover:bg-[#783916] text-white font-medium py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#783916] disabled:opacity-50"
                  >
                    <span>
                      {isSubmittingOrder ? 'Procesando en el servidor...' : 'Finalizar Pedido de Café'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <p className="text-[10px] text-center text-[#8c7e72]">
                  🔒 Pago encriptado. Tueste artesanal garantizado menor a 7 días.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Dialog Modal */}
      <Dialog open={checkoutSuccess} onOpenChange={setCheckoutSuccess}>
        <DialogContent className="bg-[#fbf9f5] border-[#ded4c5] text-[#29211b] max-w-md shadow-2xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-full bg-[#eef7ee] border border-[#cbe4cc] text-[#2b6634] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="font-serif text-2xl text-center text-[#261f1a]">
              ¡Tu Pedido de Café está en Marcha!
            </DialogTitle>
            <DialogDescription className="text-center text-[#66574a] text-sm mt-2">
              Hemos enviado la confirmación y la guía de tueste fresco a{' '}
              <strong className="text-[#8f461e]">{customerEmail}</strong>. Tus granos serán
              empaquetados en bolsa con válvula desgasificadora unidireccional.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-white border border-[#ded5c6] text-xs text-[#4a3c30] space-y-1.5 my-2 shadow-xs">
            <div className="flex justify-between">
              <span className="text-[#78695c]">Número de lote:</span>
              <span className="font-mono text-[#8f461e] font-semibold">
                {orderConfirmation?.orderNumber || '#AURA-2026'}
              </span>
            </div>
            {orderConfirmation?.total !== undefined && (
              <div className="flex justify-between">
                <span className="text-[#78695c]">Total confirmado:</span>
                <span className="font-semibold text-[#261f1a]">
                  ${orderConfirmation.total.toFixed(2)} USD
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#78695c]">Fecha de tueste:</span>
              <span>{orderConfirmation?.roastDate || 'Esta semana (Frescura pico)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78695c]">Despacho garantizado:</span>
              <span>{orderConfirmation?.estimatedDispatch || '48 horas'}</span>
            </div>
          </div>

          <Button
            onClick={() => {
              setCheckoutSuccess(false);
              setIsCartOpen(false);
            }}
            className="w-full bg-[#8f461e] hover:bg-[#783916] text-white font-medium rounded-xl py-2.5 mt-2 cursor-pointer shadow-xs border border-[#783916]"
          >
            Continuar Descubriendo Cafés
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
