import moment from 'moment';

export type TrackingEvent = {
  id: string;
  title: string;
  description?: string;
  time: string;
  done: boolean;
};

export type OrderItem = {
  productId: string;
  name: string;
  thumbnail: number;
  quantity: number;
};

export type RentalDetails = {
  billingUnit: 'hours' | 'days' | 'months';
  duration: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  deposit: number;
  returnPickup?: {
    date: string;
    timeSlot: string;
    scheduledAt: string;
  };
};

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'IN_USE'
  | 'RETURN_DUE'
  | 'RETURN_SCHEDULED'
  | 'RETURN_PICKED'
  | 'RETURNED'
  | 'CANCELLED';

export type MockOrder = {
  id: string;
  type: 'rental' | 'homeService';
  status: OrderStatus;
  statusLabel: string;
  placedAt: string;
  totalAmount: number;
  etaText?: string;
  addressShort: string;
  items: OrderItem[];
  tracking: TrackingEvent[];
  returnTracking?: TrackingEvent[];
  cancellationReason?: string;
  rider?: {
    name: string;
    phoneMasked: string;
    vehicle: string;
    rating: number;
  };
  rental?: RentalDetails;
};

const INITIAL_ORDERS: MockOrder[] = [
  {
    id: 'ORD-RNT-102938',
    type: 'rental',
    status: 'OUT_FOR_DELIVERY',
    statusLabel: 'Out for delivery',
    placedAt: '2026-05-26T16:45:00Z',
    totalAmount: 897,
    etaText: 'Arriving in 35–50 mins',
    addressShort: 'Banjara Hills, Hyderabad',
    rental: {
      billingUnit: 'days',
      duration: 5,
      startDate: moment().format('YYYY-MM-DD'),
      endDate: moment().add(5, 'days').format('YYYY-MM-DD'),
      deposit: 1500,
    },
    items: [
      {
        productId: 'rp1',
        name: 'Wheelchair (Foldable)',
        thumbnail: require('../assets/Physiotherapy.png'),
        quantity: 1,
      },
    ],
    rider: {
      name: 'Ravi (Delivery)',
      phoneMasked: '+91 98XX-XX210',
      vehicle: 'TS09 AB 1234',
      rating: 4.8,
    },
    tracking: [
      {
        id: 't1',
        title: 'Order placed',
        description: 'We received your rental request.',
        time: '2026-05-26T16:45:00Z',
        done: true,
      },
      {
        id: 't2',
        title: 'Confirmed',
        description: 'Team verified availability and assigned a rider.',
        time: '2026-05-26T17:05:00Z',
        done: true,
      },
      {
        id: 't3',
        title: 'Packed & sanitized',
        description: 'Product sanitized and packed for dispatch.',
        time: '2026-05-26T17:25:00Z',
        done: true,
      },
      {
        id: 't4',
        title: 'Out for delivery',
        description: 'Rider is on the way to your address.',
        time: '2026-05-26T17:40:00Z',
        done: true,
      },
      {
        id: 't5',
        title: 'Delivered',
        description: 'Product handed over at your address.',
        time: 'ETA',
        done: false,
      },
    ],
  },
  {
    id: 'ORD-RNT-889120',
    type: 'rental',
    status: 'IN_USE',
    statusLabel: 'Rental in progress',
    placedAt: '2026-05-21T10:10:00Z',
    totalAmount: 1249,
    etaText: 'Return by 26 May 2026',
    addressShort: 'Kondapur, Hyderabad',
    rental: {
      billingUnit: 'days',
      duration: 5,
      startDate: '2026-05-21',
      endDate: '2026-05-26',
      deposit: 3000,
    },
    items: [
      {
        productId: 'rp2',
        name: 'Oxygen Concentrator (5L)',
        thumbnail: require('../assets/Pulmonologist.png'),
        quantity: 1,
      },
    ],
    tracking: [
      { id: 't1', title: 'Order placed', time: '2026-05-21T10:10:00Z', done: true },
      { id: 't2', title: 'Confirmed', time: '2026-05-21T10:30:00Z', done: true },
      { id: 't3', title: 'Delivered', time: '2026-05-21T12:10:00Z', done: true },
      { id: 't4', title: 'Rental started', time: '2026-05-21T12:10:00Z', done: true },
    ],
  },
  {
    id: 'ORD-RNT-554321',
    type: 'rental',
    status: 'RETURN_DUE',
    statusLabel: 'Return due',
    placedAt: '2026-05-15T09:00:00Z',
    totalAmount: 1499,
    etaText: 'Schedule pickup today',
    addressShort: 'Madhapur, Hyderabad',
    rental: {
      billingUnit: 'days',
      duration: 5,
      startDate: '2026-05-15',
      endDate: '2026-05-20',
      deposit: 800,
    },
    items: [
      {
        productId: 'rp3',
        name: 'Nebulizer (Compressor)',
        thumbnail: require('../assets/ENT.png'),
        quantity: 1,
      },
    ],
    tracking: [
      { id: 't1', title: 'Order placed', time: '2026-05-15T09:00:00Z', done: true },
      { id: 't2', title: 'Delivered', time: '2026-05-15T11:00:00Z', done: true },
      { id: 't3', title: 'Rental period ended', time: '2026-05-20T23:59:00Z', done: true },
    ],
  },
];

let orders: MockOrder[] = INITIAL_ORDERS.map(o => ({ ...o }));

export function getAllOrders(): MockOrder[] {
  return orders.map(o => ({ ...o }));
}

export function getOrderById(id: string): MockOrder | undefined {
  const o = orders.find(x => x.id === id);
  return o ? { ...o } : undefined;
}

export function canCancelOrder(order: MockOrder): boolean {
  return ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(order.status);
}

export function canScheduleReturn(order: MockOrder): boolean {
  if (order.type !== 'rental' || !order.rental) return false;
  if (order.rental.returnPickup) return false;
  return ['IN_USE', 'RETURN_DUE'].includes(order.status);
}

export function isOrderActive(order: MockOrder): boolean {
  return !['RETURNED', 'CANCELLED'].includes(order.status);
}

export function isOrderCompleted(order: MockOrder): boolean {
  return order.status === 'RETURNED';
}

export function isOrderCancelled(order: MockOrder): boolean {
  return order.status === 'CANCELLED';
}

export function getRentalDaysRemaining(order: MockOrder): number | null {
  if (!order.rental) return null;
  const end = moment(order.rental.endDate).endOf('day');
  return Math.max(0, end.diff(moment(), 'days'));
}

export function formatRentalPeriod(order: MockOrder): string {
  if (!order.rental) return '';
  const { duration, billingUnit, startDate, endDate } = order.rental;
  const unitLabel =
    billingUnit === 'days' ? 'day' : billingUnit === 'hours' ? 'hour' : 'month';
  return `${duration} ${unitLabel}${duration > 1 ? 's' : ''} · ${moment(startDate).format('DD MMM')} – ${moment(endDate).format('DD MMM YYYY')}`;
}

export function cancelOrder(orderId: string, reason: string): MockOrder | undefined {
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return undefined;
  const order = orders[idx];
  if (!canCancelOrder(order)) return undefined;

  const updated: MockOrder = {
    ...order,
    status: 'CANCELLED',
    statusLabel: 'Cancelled',
    cancellationReason: reason,
    etaText: undefined,
    rider: undefined,
    tracking: [
      ...order.tracking.filter(e => e.done),
      {
        id: 'cx1',
        title: 'Order cancelled',
        description: reason,
        time: moment().toISOString(),
        done: true,
      },
    ],
  };
  orders[idx] = updated;
  return { ...updated };
}

export function scheduleReturn(
  orderId: string,
  pickup: { date: string; timeSlot: string },
): MockOrder | undefined {
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return undefined;
  const order = orders[idx];
  if (!canScheduleReturn(order) || !order.rental) return undefined;

  const scheduledAt = moment().toISOString();
  const updated: MockOrder = {
    ...order,
    status: 'RETURN_SCHEDULED',
    statusLabel: 'Return scheduled',
    etaText: `Pickup on ${moment(pickup.date).format('DD MMM')} · ${pickup.timeSlot}`,
    rental: {
      ...order.rental,
      returnPickup: { ...pickup, scheduledAt },
    },
    returnTracking: [
      {
        id: 'r1',
        title: 'Return requested',
        description: 'Pickup scheduled from your address.',
        time: scheduledAt,
        done: true,
      },
      {
        id: 'r2',
        title: 'Pickup scheduled',
        description: `${moment(pickup.date).format('dddd, DD MMM')} · ${pickup.timeSlot}`,
        time: scheduledAt,
        done: true,
      },
      {
        id: 'r3',
        title: 'Agent assigned',
        description: 'Our team will call before arrival.',
        time: 'Pending',
        done: false,
      },
      {
        id: 'r4',
        title: 'Product picked up',
        description: 'Item collected and deposit review started.',
        time: 'Pending',
        done: false,
      },
      {
        id: 'r5',
        title: 'Return completed',
        description: 'Deposit refund within 3–5 business days.',
        time: 'Pending',
        done: false,
      },
    ],
  };
  orders[idx] = updated;
  return { ...updated };
}

/** Mock: mark return as picked up (for demo after scheduling) */
export function completeReturn(orderId: string): MockOrder | undefined {
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return undefined;
  const order = orders[idx];
  if (order.status !== 'RETURN_SCHEDULED' && order.status !== 'RETURN_PICKED') return undefined;

  const updated: MockOrder = {
    ...order,
    status: 'RETURNED',
    statusLabel: 'Returned',
    etaText: 'Deposit refund in 3–5 days',
    returnTracking: (order.returnTracking || []).map((e, i) => ({
      ...e,
      done: true,
      time: e.time === 'Pending' ? moment().toISOString() : e.time,
    })),
  };
  orders[idx] = updated;
  return { ...updated };
}

export function addRentalOrderFromBooking(params: {
  orderId: string;
  productId: string;
  productName: string;
  thumbnail: number;
  billingUnit: 'hours' | 'days' | 'months';
  duration: number;
  totalAmount: number;
  deposit: number;
  addressShort: string;
}): MockOrder {
  const startDate = moment().format('YYYY-MM-DD');
  const endDate =
    params.billingUnit === 'days'
      ? moment().add(params.duration, 'days').format('YYYY-MM-DD')
      : params.billingUnit === 'hours'
        ? moment().add(params.duration, 'hours').format('YYYY-MM-DD')
        : moment().add(params.duration, 'months').format('YYYY-MM-DD');

  const newOrder: MockOrder = {
    id: params.orderId,
    type: 'rental',
    status: 'PLACED',
    statusLabel: 'Order placed',
    placedAt: moment().toISOString(),
    totalAmount: params.totalAmount,
    etaText: 'Delivery in 35–50 mins',
    addressShort: params.addressShort,
    rental: {
      billingUnit: params.billingUnit,
      duration: params.duration,
      startDate,
      endDate,
      deposit: params.deposit,
    },
    items: [
      {
        productId: params.productId,
        name: params.productName,
        thumbnail: params.thumbnail,
        quantity: 1,
      },
    ],
    tracking: [
      {
        id: 't1',
        title: 'Order placed',
        description: `${params.duration} ${params.billingUnit} rental booked.`,
        time: moment().toISOString(),
        done: true,
      },
      {
        id: 't2',
        title: 'Confirmed',
        time: 'Pending',
        done: false,
      },
      {
        id: 't3',
        title: 'Out for delivery',
        time: 'Pending',
        done: false,
      },
      {
        id: 't4',
        title: 'Delivered',
        time: 'Pending',
        done: false,
      },
    ],
  };
  orders = [newOrder, ...orders];
  return { ...newOrder };
}

/** When delivery completes (mock), move rental to IN_USE */
export function markRentalDelivered(orderId: string): void {
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return;
  const order = orders[idx];
  if (order.type !== 'rental' || !order.rental) return;

  orders[idx] = {
    ...order,
    status: 'IN_USE',
    statusLabel: 'Rental in progress',
    etaText: `Return by ${moment(order.rental.endDate).format('DD MMM YYYY')}`,
    tracking: order.tracking.map(e =>
      e.title === 'Delivered' || e.title.includes('delivery')
        ? { ...e, done: true, time: moment().toISOString() }
        : e,
    ),
  };
}
