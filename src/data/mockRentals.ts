export type RentalProduct = {
  id: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  description: string;
  thumbnail: number;
  gallery?: number[];
  hourlyRate: number;
  dailyRate: number;
  deposit: number;
  deliveryFee: number;
  rating: number;
  reviewCount: number;
  availableNow: boolean;
  etaMinutes: number;
  refundableDeposit: boolean;
  specs: Array<{ label: string; value: string }>;
  highlights: string[];
  included: string[];
  safety: string[];
  instructions: string[];
};

export const RENTAL_PRODUCTS: RentalProduct[] = [
  {
    id: 'rp1',
    categoryId: 'rc-wheelchair',
    name: 'Wheelchair (Foldable)',
    shortDescription: 'Lightweight, easy to fold, safe brakes.',
    description:
      'Comfortable foldable wheelchair for indoor and outdoor use. Suitable for post-surgery support and elderly mobility. Includes safety belt and dual brakes.',
    thumbnail: require('../assets/Physiotherapy.png'),
    gallery: [require('../assets/Physiotherapy.png'), require('../assets/HomeServices.png')],
    hourlyRate: 49,
    dailyRate: 299,
    deposit: 1500,
    deliveryFee: 49,
    rating: 4.8,
    reviewCount: 312,
    availableNow: true,
    etaMinutes: 35,
    refundableDeposit: true,
    specs: [
      { label: 'Max load', value: '110 kg' },
      { label: 'Foldable', value: 'Yes' },
      { label: 'Brakes', value: 'Dual' },
      { label: 'Seat width', value: '18 in' },
    ],
    highlights: ['Fast delivery', 'Sanitized before dispatch', 'Comfort cushion'],
    included: ['Wheelchair', 'Seat belt', 'Safety guide'],
    safety: ['Sanitized', 'Contactless delivery option', 'Quality checked'],
    instructions: ['Lock brakes before sitting', 'Avoid wet/slippery floors'],
  },
  {
    id: 'rp2',
    categoryId: 'rc-oxygen',
    name: 'Oxygen Concentrator (5L)',
    shortDescription: 'Stable flow, low noise, home-friendly.',
    description:
      'Reliable oxygen concentrator for home care. Ideal for respiratory support under doctor guidance. Includes user manual and basic maintenance kit.',
    thumbnail: require('../assets/Pulmonologist.png'),
    gallery: [require('../assets/Pulmonologist.png'), require('../assets/InternalMedicine.png.jpg')],
    hourlyRate: 79,
    dailyRate: 499,
    deposit: 3000,
    deliveryFee: 79,
    rating: 4.7,
    reviewCount: 228,
    availableNow: true,
    etaMinutes: 55,
    refundableDeposit: true,
    specs: [
      { label: 'Flow', value: '0.5–5 LPM' },
      { label: 'Noise', value: '≤ 45 dB' },
      { label: 'Power', value: 'AC 220V' },
      { label: 'Usage', value: 'Home' },
    ],
    highlights: ['Technician setup', 'Usage demo', '24×7 support'],
    included: ['Concentrator', 'Nasal cannula', 'Manual', 'Filter kit'],
    safety: ['Electrical safety check', 'Filter hygiene guide', 'Support hotline'],
    instructions: ['Keep 1 ft away from wall', 'Clean filter weekly'],
  },
  {
    id: 'rp3',
    categoryId: 'rc-nebulizer',
    name: 'Nebulizer (Compressor)',
    shortDescription: 'Quick mist output for daily respiratory care.',
    description:
      'Compressor nebulizer suitable for children and adults. Works with prescribed solutions. Comes with adult and child masks.',
    thumbnail: require('../assets/ENT.png'),
    gallery: [require('../assets/ENT.png'), require('../assets/Pulmonologist.png')],
    hourlyRate: 19,
    dailyRate: 149,
    deposit: 800,
    deliveryFee: 29,
    rating: 4.6,
    reviewCount: 190,
    availableNow: true,
    etaMinutes: 40,
    refundableDeposit: true,
    specs: [
      { label: 'Particle size', value: '2–5 μm' },
      { label: 'Mask', value: 'Adult + Child' },
      { label: 'Noise', value: 'Low' },
    ],
    highlights: ['Best for home use', 'Easy to clean', 'Compact design'],
    included: ['Nebulizer', '2 masks', 'Mouthpiece', 'Tubing'],
    safety: ['Sanitized kit', 'Sealed packaging'],
    instructions: ['Wash kit after use', 'Dry parts before storing'],
  },
  {
    id: 'rp4',
    categoryId: 'rc-bed',
    name: 'Patient Bed (Manual)',
    shortDescription: 'Backrest adjustment + side rails.',
    description:
      'Manual patient bed for home recovery. Includes side rails for safety and adjustable backrest. Delivery and basic installation included.',
    thumbnail: require('../assets/HomeServices.png'),
    gallery: [require('../assets/HomeServices.png'), require('../assets/nursing.jpg')],
    hourlyRate: 99,
    dailyRate: 699,
    deposit: 5000,
    deliveryFee: 149,
    rating: 4.8,
    reviewCount: 144,
    availableNow: false,
    etaMinutes: 180,
    refundableDeposit: true,
    specs: [
      { label: 'Rails', value: 'Yes' },
      { label: 'Backrest', value: 'Adjustable' },
      { label: 'Wheels', value: 'Lockable' },
    ],
    highlights: ['Safe rails', 'Home installation', 'Comfort mattress add-on'],
    included: ['Bed frame', 'Side rails', 'Wheels', 'Manual'],
    safety: ['Installed by trained staff', 'Brake check at handover'],
    instructions: ['Lock wheels before use', 'Use rails when unattended'],
  },
];

export function getRentalProductById(id: string): RentalProduct | undefined {
  return RENTAL_PRODUCTS.find(p => p.id === id);
}

