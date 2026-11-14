import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  Ban,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  PhoneCall,
  Store,
  Truck,
  RotateCcw,
  Percent,
  Search,
  Receipt,
  FileText,
  Users,
  UserPlus,
  MapPin,
  Phone,
  X,
  Check,
} from 'lucide-react';
import {
  Product,
  Order,
  SalesChannel,
  SALES_CHANNEL_LABELS,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  User,
  Customer,
} from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';
import { dbService } from '../db/database';

interface PosModuleProps {
  products: Product[];
  currentUser: User;
  initialCustomer?: Customer | null;
  onClearInitialCustomer?: () => void;
  onOrderCompleted: (order: Order) => void;
  onPrintOrder: (order: Order) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  breadType: string;
  notes: string;
  unitPrice: number;
}

export const PosModule: React.FC<PosModuleProps> = ({
  products,
  currentUser,
  initialCustomer,
  onClearInitialCustomer,
  onOrderCompleted,
  onPrintOrder,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel>('dine_in');
  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableOrCustomer, setTableOrCustomer] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [orderHistory, setOrderHistory] = useState<Order[]>(() => dbService.getOrders(50));
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Customer Management Integration
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [customerSearchText, setCustomerSearchText] = useState<string>('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);

  // Quick Customer Form
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [quickError, setQuickError] = useState('');

  // Respond to initialCustomer prop changes
  React.useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      setTableOrCustomer(`${initialCustomer.full_name} (${initialCustomer.phone})`);
      setSelectedChannel('phone');
      if (initialCustomer.last_order_notes) {
        setOrderNotes(initialCustomer.last_order_notes);
      }
    }
  }, [initialCustomer]);

  const breadOptions = ['Lavaş', 'Sütlü Ekmek', 'Pide Ekmek', 'Somun', 'Porsiyon/Tabak'];
  const categories = ['Hepsi', 'Döner', 'Porsiyon', 'Pilav Üstü', 'Yan Ürün', 'İçecek'];

  // Calculate unit price for a product based on current channel
  const getProductPrice = (product: Product): number => {
    if (product.channel_prices && product.channel_prices[selectedChannel] !== undefined) {
      return product.channel_prices[selectedChannel];
    }
    return product.base_price;
  };

  // Add item to cart
  const handleAddToCart = (product: Product) => {
    const price = getProductPrice(product);
    const defaultBread = product.category === 'Döner' ? 'Lavaş' : product.category === 'Porsiyon' ? 'Pide Ekmek' : '';
    
    // Check if same item with same bread exists
    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.breadType === defaultBread && !item.notes
    );

    if (existingIndex > -1) {
      const nextCart = [...cart];
      nextCart[existingIndex].quantity += 1;
      setCart(nextCart);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          breadType: defaultBread,
          notes: '',
          unitPrice: price,
        },
      ]);
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const nextCart = [...cart];
    const newQty = nextCart[index].quantity + delta;
    if (newQty <= 0) {
      nextCart.splice(index, 1);
    } else {
      nextCart[index].quantity = newQty;
    }
    setCart(nextCart);
  };

  const handleUpdateBread = (index: number, bread: string) => {
    const nextCart = [...cart];
    nextCart[index].breadType = bread;
    setCart(nextCart);
  };

  const handleUpdateNotes = (index: number, notes: string) => {
    const nextCart = [...cart];
    nextCart[index].notes = notes;
    setCart(nextCart);
  };

  const handleRemoveItem = (index: number) => {
    const nextCart = [...cart];
    nextCart.splice(index, 1);
    setCart(nextCart);
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setDiscountReason('');
    setTableOrCustomer('');
    setOrderNotes('');
    setSelectedCustomer(null);
    setCustomerSearchText('');
    setIsCustomerListOpen(false);
    if (onClearInitialCustomer) onClearInitialCustomer();
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setQuickError('Lütfen müşteri isim soyisim giriniz.');
      return;
    }
    if (!quickPhone.trim()) {
      setQuickError('Lütfen telefon numarası giriniz.');
      return;
    }
    if (!quickAddress.trim()) {
      setQuickError('Lütfen teslimat adresi giriniz.');
      return;
    }

    try {
      const newCust = dbService.addCustomer({
        full_name: quickName,
        phone: quickPhone,
        address: quickAddress,
        notes: quickNotes,
      });

      setSelectedCustomer(newCust);
      setTableOrCustomer(`${newCust.full_name} (${newCust.phone})`);
      setSelectedChannel('phone');
      setIsQuickAddCustomerOpen(false);
      setQuickName('');
      setQuickPhone('');
      setQuickAddress('');
      setQuickNotes('');
      setQuickError('');
    } catch (err: any) {
      setQuickError(err.message || 'Müşteri eklenirken hata oluştu.');
    }
  };

  // Totals
  const subtotal = cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Complete Order
  const handleCheckout = (paymentMethod: PaymentMethod) => {
    if (cart.length === 0) return;

    try {
      const order = dbService.createOrder({
        channel: selectedChannel,
        table_or_customer: tableOrCustomer.trim() || (selectedCustomer ? `${selectedCustomer.full_name} (${selectedCustomer.phone})` : 'Misafir'),
        payment_method: paymentMethod,
        discount_amount: discountAmount,
        discount_reason: discountReason,
        notes: orderNotes,
        cashier_id: currentUser.id,
        cashier_name: currentUser.display_name,
        items: cart.map((it) => ({
          product_id: it.product.id,
          product_name: it.product.name,
          bread_type: it.breadType,
          unit_price: it.unitPrice,
          quantity: it.quantity,
          notes: it.notes,
        })),
      });

      // If customer was selected, update customer profile stats & last order summary
      if (selectedCustomer) {
        const orderSummary = cart
          .map((it) => `${it.quantity}x ${it.product.name}${it.breadType ? ` (${it.breadType})` : ''}`)
          .join(', ');
        dbService.recordCustomerOrder(selectedCustomer.id, order.total_amount, orderSummary);
      }

      // Clear cart
      handleClearCart();
      // Notify parent & refresh
      onOrderCompleted(order);
      setOrderHistory(dbService.getOrders(50));
      // Auto open thermal print preview
      onPrintOrder(order);
    } catch (err: any) {
      alert(`Sipariş kaydedilirken hata oluştu: ${err.message}`);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'Hepsi' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Cancel order execution
  const handleConfirmCancel = () => {
    if (!cancelModalOrder || !cancelReason.trim()) return;
    try {
      dbService.cancelOrder(cancelModalOrder.id, cancelReason.trim(), currentUser.display_name);
      setCancelModalOrder(null);
      setCancelReason('');
      setOrderHistory(dbService.getOrders(50));
      onOrderCompleted(cancelModalOrder);
      alert('Sipariş başarıyla iptal edildi ve stoklar ile kasa bakiyesi geri yüklendi.');
    } catch (err: any) {
      alert(`İptal hatası: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top POS / History Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pos'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-800'
            }`}
          >
            <ShoppingCart size={15} />
            <span>Dokunmatik Kasa & Satış</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setOrderHistory(dbService.getOrders(50));
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-800'
            }`}
          >
            <Receipt size={15} />
            <span>Sipariş Geçmişi & İadeler ({orderHistory.length})</span>
          </button>
        </div>

        {/* Channel Selector Pills */}
        {activeTab === 'pos' && (
          <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-navy-950 p-1 rounded-xl border border-slate-300 dark:border-navy-800">
            {(['dine_in', 'takeaway', 'yemeksepeti', 'phone', 'other'] as SalesChannel[]).map((ch) => {
              const isSelected = selectedChannel === ch;
              return (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {ch === 'dine_in' && <Store size={13} />}
                  {ch === 'takeaway' && <Truck size={13} />}
                  {ch === 'yemeksepeti' && <Smartphone size={13} />}
                  {ch === 'phone' && <PhoneCall size={13} />}
                  <span>{SALES_CHANNEL_LABELS[ch]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeTab === 'pos' ? (
        /* MAIN POS INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: PRODUCTS CATALOG (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Category tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-navy-900 p-3 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-brand-500 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg text-xs focus:outline-hidden text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const price = getProductPrice(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="p-3.5 bg-white dark:bg-navy-900 hover:bg-brand-50/50 dark:hover:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-800 hover:border-brand-500/50 shadow-xs text-left transition-all active:scale-[0.98] flex flex-col justify-between h-28 group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-brand-600 dark:text-brand-400 font-semibold mb-1">
                        <span>{p.category}</span>
                        {p.is_campaign === 1 && (
                          <span className="bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-1.5 py-0.2 rounded">
                            Menü
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {p.name}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-navy-800">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(price)}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={14} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: TICKET / CART & CHECKOUT (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xl flex flex-col h-[690px] overflow-hidden">
            {/* Cart Header */}
            <div className="p-4 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <ShoppingCart size={16} className="text-brand-500" />
                  <span>Adisyon / Sipariş Sepeti</span>
                </h3>
                <div className="text-[11px] text-slate-400">
                  Kanal: <span className="font-semibold text-brand-600">{SALES_CHANNEL_LABELS[selectedChannel]}</span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>Temizle</span>
                </button>
              )}
            </div>

            {/* Customer / Table Selection Hub */}
            <div className="px-3.5 py-2.5 bg-slate-100/70 dark:bg-navy-950/70 border-b border-slate-200 dark:border-navy-800 space-y-2">
              {selectedCustomer ? (
                <div className="p-2.5 bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-brand-700 dark:text-brand-300">
                      <Users size={14} className="text-brand-500 shrink-0" />
                      <span className="truncate max-w-[150px]">{selectedCustomer.full_name}</span>
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        ({selectedCustomer.phone})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setTableOrCustomer('');
                        if (onClearInitialCustomer) onClearInitialCustomer();
                      }}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                      title="Müşteriyi Kaldır"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex items-start gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-tight">{selectedCustomer.address}</span>
                  </div>

                  {selectedCustomer.last_order_notes && (
                    <div className="flex items-center justify-between gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">
                      <span className="truncate">★ {selectedCustomer.last_order_notes}</span>
                      <button
                        type="button"
                        onClick={() => setOrderNotes(selectedCustomer.last_order_notes || '')}
                        className="text-[9px] font-bold text-brand-600 dark:text-brand-400 hover:underline shrink-0"
                      >
                        Notu Ekle
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Masa No veya Müşteri Ara (İsim / Telefon)..."
                        value={customerSearchText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerSearchText(val);
                          setTableOrCustomer(val);
                          if (val.trim().length >= 1) {
                            setCustomerResults(dbService.getCustomers(val));
                            setIsCustomerListOpen(true);
                          } else {
                            setIsCustomerListOpen(false);
                          }
                        }}
                        onFocus={() => {
                          if (customerSearchText.trim().length >= 1) {
                            setCustomerResults(dbService.getCustomers(customerSearchText));
                            setIsCustomerListOpen(true);
                          }
                        }}
                        className="w-full bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerResults(dbService.getCustomers());
                        setIsCustomerListOpen(!isCustomerListOpen);
                      }}
                      title="Kayıtlı Müşteri Rehberi"
                      className="p-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-brand-500 hover:border-brand-500 transition-colors shrink-0"
                    >
                      <Users size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickName(customerSearchText);
                        setIsQuickAddCustomerOpen(true);
                      }}
                      title="Hızlı Yeni Müşteri Kaydı"
                      className="p-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 shadow-xs transition-colors shrink-0"
                    >
                      <UserPlus size={14} />
                    </button>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isCustomerListOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-56 overflow-y-auto bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-xl p-1.5 space-y-1">
                      <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-slate-400 border-b border-slate-100 dark:border-navy-800">
                        <span>Kayıtlı Müşteriler ({customerResults.length})</span>
                        <button
                          type="button"
                          onClick={() => setIsCustomerListOpen(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      {customerResults.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          <p>Eşleşen müşteri bulunamadı.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomerListOpen(false);
                              setQuickName(customerSearchText);
                              setIsQuickAddCustomerOpen(true);
                            }}
                            className="inline-block mt-1.5 text-xs text-brand-500 font-bold hover:underline"
                          >
                            + Yeni Kayıt Aç
                          </button>
                        </div>
                      ) : (
                        customerResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setTableOrCustomer(`${c.full_name} (${c.phone})`);
                              setSelectedChannel('phone');
                              setIsCustomerListOpen(false);
                              if (c.last_order_notes) {
                                setOrderNotes(c.last_order_notes);
                              }
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/50 border border-transparent hover:border-brand-200 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800 dark:text-white">
                                {c.full_name}
                              </span>
                              <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                                {c.phone}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {c.address}
                            </div>
                            {c.last_order_notes && (
                              <div className="text-[9px] text-amber-600 dark:text-amber-400 truncate mt-0.5">
                                ★ {c.last_order_notes}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-2">
                  <ShoppingCart size={40} className="stroke-[1.5] text-slate-300 dark:text-navy-700" />
                  <p className="text-xs">Sepetiniz şu anda boş.</p>
                  <p className="text-[11px] text-slate-400">
                    Sol taraftaki menüden ürün seçerek adisyona ekleyin.
                  </p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 dark:text-white truncate max-w-[190px]">
                        {item.product.name}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </div>
                    </div>

                    {/* Bread Selector for Doner & Poriyon */}
                    {item.product.category === 'Döner' && (
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                        {breadOptions.map((b) => (
                          <button
                            key={b}
                            onClick={() => handleUpdateBread(index, b)}
                            className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap font-medium transition-colors ${
                              item.breadType === b
                                ? 'bg-brand-500 text-white font-bold'
                                : 'bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Notes input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Özel istek / Not (bol sos, az soğan...)"
                        value={item.notes}
                        onChange={(e) => handleUpdateNotes(index, e.target.value)}
                        className="flex-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-200"
                      />

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg p-0.5">
                        <button
                          onClick={() => handleUpdateQty(index, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(index, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount & Totals Section */}
            <div className="p-4 bg-slate-50 dark:bg-navy-950 border-t border-slate-200 dark:border-navy-800 space-y-2">
              {/* Discount Accordion/Input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="İndirim (TL)"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="İndirim Sebebi (Personel, Tanıdık, Kampanya)"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="flex-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-white"
                />
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Ara Toplam:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-500 font-semibold">
                    <span>İndirim:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-navy-800">
                  <span>Ödenecek Tutar:</span>
                  <span className="text-brand-600 dark:text-brand-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  disabled={cart.length === 0}
                  onClick={() => handleCheckout('cash')}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <Banknote size={18} />
                  <span>Nakit Kasa</span>
                </button>

                <button
                  disabled={cart.length === 0}
                  onClick={() => handleCheckout('credit_card')}
                  className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <CreditCard size={18} />
                  <span>Kredi Kartı / POS</span>
                </button>

                <button
                  disabled={cart.length === 0}
                  onClick={() => handleCheckout(selectedChannel === 'yemeksepeti' ? 'yemeksepeti_online' : 'meal_card')}
                  className="p-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <Smartphone size={18} />
                  <span>{selectedChannel === 'yemeksepeti' ? 'Yemeksepeti' : 'Yemek Kartı'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ORDER HISTORY & CANCELLATIONS TAB */
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Son Siparişler ve Adisyon Listesi
              </h3>
              <p className="text-xs text-slate-400">
                Sipariş iptali veya iade yapıldığında reçete stokları ve kasa bakiyesi otomatik geri döner.
              </p>
            </div>
            <button
              onClick={() => setOrderHistory(dbService.getOrders(100))}
              className="px-3 py-1.5 bg-slate-100 dark:bg-navy-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Yenile
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="py-2.5 px-3">Fiş No</th>
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">Kanal</th>
                  <th className="py-2.5 px-3">Masa / Müşteri</th>
                  <th className="py-2.5 px-3">Ürünler</th>
                  <th className="py-2.5 px-3">Tutar</th>
                  <th className="py-2.5 px-3">Ödeme</th>
                  <th className="py-2.5 px-3">Durum</th>
                  <th className="py-2.5 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {orderHistory.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{formatDateTime(o.created_at)}</td>
                    <td className="py-3 px-3 font-medium">{SALES_CHANNEL_LABELS[o.channel]}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{o.table_or_customer || '-'}</td>
                    <td className="py-3 px-3 max-w-xs truncate text-slate-600 dark:text-slate-300">
                      {o.items?.map((it) => `${it.quantity}x ${it.product_name}`).join(', ')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="py-3 px-3">{PAYMENT_METHOD_LABELS[o.payment_method]}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          o.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {o.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => onPrintOrder(o)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-brand-600"
                        title="Fiş Yazdır"
                      >
                        <Printer size={14} />
                      </button>
                      {o.status === 'completed' && (
                        <button
                          onClick={() => setCancelModalOrder(o)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100"
                          title="Siparişi İptal Et / İade Al"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Ban size={24} />
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                Sipariş İptali ve İade Onayı
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">{cancelModalOrder.order_number}</strong> nolu siparişi iptal etmek üzeresiniz.
              Reçeteye bağlı tüketilen tüm stoklar depoya geri dönecek ve {formatCurrency(cancelModalOrder.total_amount)} tutarındaki tahsilat kasadan düşülecektir.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                İptal Sebebi (Zorunlu):
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Örn: Müşteri siparişi iptal etti / Yanlış sipariş girildi..."
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                Vazgeç
              </button>
              <button
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-md shadow-rose-600/30"
              >
                İptali Onayla ve Stokları İade Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {isQuickAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-white">
                <UserPlus size={16} className="text-brand-500" />
                <span>Hızlı Müşteri Kaydı</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddCustomerOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="p-4 space-y-3">
              {quickError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs">
                  {quickError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İsim Soyisim <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefon Numarası <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 0532 123 45 67"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teslimat Adresi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Mahalle, Cadde, Sokak, Kapı No, Kat, Daire..."
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Müşteri Sipariş Tercih Notu (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Bol soslu, acısız lavaş"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-navy-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomerOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-xs"
                >
                  Kaydet ve Siparişe Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
