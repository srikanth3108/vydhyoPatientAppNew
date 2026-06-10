export type RentalCategory = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  gradient: [string, string];
  agentCount: number;
  image?: number;
};

export type RentalAgent = {
  id: string;
  name: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  deliveryETA: string;
  verified: boolean;
  avatar: string;
  tagline: string;
  yearsExp: number;
  productIds: string[];
};

export const RENTAL_CATEGORIES: RentalCategory[] = [
  {
    id: 'rc-wheelchair',
    name: 'Wheelchairs',
    emoji: '♿',
    tagline: 'Foldable, motorized & more',
    gradient: ['#0EA5E9', '#0369A1'],
    agentCount: 3,
    image: require('../assets/Physiotherapy.png'),
  },
  {
    id: 'rc-oxygen',
    name: 'Oxygen Equipment',
    emoji: '🫁',
    tagline: 'Concentrators & cylinders',
    gradient: ['#10B981', '#047857'],
    agentCount: 2,
    image: require('../assets/Pulmonologist.png'),
  },
  {
    id: 'rc-nebulizer',
    name: 'Nebulizers',
    emoji: '💨',
    tagline: 'Compressor & mesh types',
    gradient: ['#F59E0B', '#D97706'],
    agentCount: 2,
    image: require('../assets/ENT.png'),
  },
  {
    id: 'rc-bed',
    name: 'Patient Beds',
    emoji: '🛏️',
    tagline: 'Manual & electric options',
    gradient: ['#8B5CF6', '#6D28D9'],
    agentCount: 2,
    image: require('../assets/HomeServices.png'),
  },
  {
    id: 'rc-monitor',
    name: 'BP & Monitors',
    emoji: '📊',
    tagline: 'Digital BP, SpO2 & more',
    gradient: ['#EF4444', '#DC2626'],
    agentCount: 2,
  },
  {
    id: 'rc-walker',
    name: 'Walkers & Crutches',
    emoji: '🦯',
    tagline: 'Adjustable walking aids',
    gradient: ['#EC4899', '#BE185D'],
    agentCount: 2,
  },
];

export const RENTAL_AGENTS: RentalAgent[] = [
  // Wheelchair agents
  {
    id: 'ra1',
    name: 'MedRent Solutions',
    categoryId: 'rc-wheelchair',
    rating: 4.9,
    reviewCount: 312,
    deliveryETA: '30–45 min',
    verified: true,
    avatar: '🏥',
    tagline: 'Premium medical equipment rentals',
    yearsExp: 8,
    productIds: ['rp1'],
  },
  {
    id: 'ra2',
    name: 'CareEquip India',
    categoryId: 'rc-wheelchair',
    rating: 4.7,
    reviewCount: 189,
    deliveryETA: '45–60 min',
    verified: true,
    avatar: '🩺',
    tagline: 'Affordable homecare solutions',
    yearsExp: 5,
    productIds: ['rp1'],
  },
  {
    id: 'ra3',
    name: 'HealthGear Pro',
    categoryId: 'rc-wheelchair',
    rating: 4.6,
    reviewCount: 145,
    deliveryETA: '60–90 min',
    verified: false,
    avatar: '⚕️',
    tagline: 'Fast delivery, quality gear',
    yearsExp: 3,
    productIds: ['rp1'],
  },

  // Oxygen agents
  {
    id: 'ra4',
    name: 'OxyHome Services',
    categoryId: 'rc-oxygen',
    rating: 4.8,
    reviewCount: 228,
    deliveryETA: '40–55 min',
    verified: true,
    avatar: '🫁',
    tagline: 'Oxygen solutions for home care',
    yearsExp: 6,
    productIds: ['rp2'],
  },
  {
    id: 'ra5',
    name: 'BreatheEasy Rentals',
    categoryId: 'rc-oxygen',
    rating: 4.7,
    reviewCount: 167,
    deliveryETA: '50–70 min',
    verified: true,
    avatar: '💚',
    tagline: 'Respiratory care experts',
    yearsExp: 4,
    productIds: ['rp2'],
  },

  // Nebulizer agents
  {
    id: 'ra6',
    name: 'NebCare Express',
    categoryId: 'rc-nebulizer',
    rating: 4.6,
    reviewCount: 190,
    deliveryETA: '30–40 min',
    verified: true,
    avatar: '💨',
    tagline: 'Quick nebulizer delivery',
    yearsExp: 5,
    productIds: ['rp3'],
  },
  {
    id: 'ra7',
    name: 'RespiRent',
    categoryId: 'rc-nebulizer',
    rating: 4.5,
    reviewCount: 132,
    deliveryETA: '40–55 min',
    verified: false,
    avatar: '🌬️',
    tagline: 'Trusted respiratory equipment',
    yearsExp: 3,
    productIds: ['rp3'],
  },

  // Patient bed agents
  {
    id: 'ra8',
    name: 'HomeBed Care',
    categoryId: 'rc-bed',
    rating: 4.8,
    reviewCount: 144,
    deliveryETA: '2–4 hrs',
    verified: true,
    avatar: '🛏️',
    tagline: 'Hospital-grade beds at home',
    yearsExp: 7,
    productIds: ['rp4'],
  },
  {
    id: 'ra9',
    name: 'RecoverEase',
    categoryId: 'rc-bed',
    rating: 4.6,
    reviewCount: 98,
    deliveryETA: '3–5 hrs',
    verified: true,
    avatar: '🏠',
    tagline: 'Recovery beds & accessories',
    yearsExp: 4,
    productIds: ['rp4'],
  },

  // BP & Monitor agents
  {
    id: 'ra10',
    name: 'VitalTrack Rentals',
    categoryId: 'rc-monitor',
    rating: 4.7,
    reviewCount: 176,
    deliveryETA: '25–35 min',
    verified: true,
    avatar: '📊',
    tagline: 'Digital health monitors on rent',
    yearsExp: 4,
    productIds: [],
  },
  {
    id: 'ra11',
    name: 'PulsePoint Care',
    categoryId: 'rc-monitor',
    rating: 4.5,
    reviewCount: 112,
    deliveryETA: '30–45 min',
    verified: false,
    avatar: '❤️',
    tagline: 'BP monitors & oximeters',
    yearsExp: 2,
    productIds: [],
  },

  // Walker agents
  {
    id: 'ra12',
    name: 'StepSure Mobility',
    categoryId: 'rc-walker',
    rating: 4.8,
    reviewCount: 203,
    deliveryETA: '30–50 min',
    verified: true,
    avatar: '🦯',
    tagline: 'Walking aids & support gear',
    yearsExp: 6,
    productIds: [],
  },
  {
    id: 'ra13',
    name: 'MoveWell Rentals',
    categoryId: 'rc-walker',
    rating: 4.4,
    reviewCount: 87,
    deliveryETA: '45–60 min',
    verified: false,
    avatar: '🚶',
    tagline: 'Affordable mobility solutions',
    yearsExp: 2,
    productIds: [],
  },
];

export function getAgentsByCategory(categoryId: string): RentalAgent[] {
  return RENTAL_AGENTS.filter(a => a.categoryId === categoryId);
}

export function getAgentById(agentId: string): RentalAgent | undefined {
  return RENTAL_AGENTS.find(a => a.id === agentId);
}

export function getCategoryById(categoryId: string): RentalCategory | undefined {
  return RENTAL_CATEGORIES.find(c => c.id === categoryId);
}
