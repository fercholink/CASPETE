import { FoodItem, Child, Transaction } from '../types';

export const COLOMBIAN_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'f1',
    name: 'Salpicón de Frutas Natural',
    category: 'fruta',
    price: 3500,
    isHealthy: true,
    seals: [],
    ingredients: ['Mango', 'Papaya', 'Banano', 'Fresas', 'Zumo de naranja natural'],
    allergens: [],
    image: '🍓'
  },
  {
    id: 'f2',
    name: 'Arepa de Maíz con Queso Campesino',
    category: 'plato_fuerte',
    price: 4500,
    isHealthy: true,
    seals: [],
    ingredients: ['Maíz peto', 'Queso bajo en sal', 'Pizca de mantequilla'],
    allergens: ['lácteos'],
    image: '🫓'
  },
  {
    id: 'f3',
    name: 'Jugo de Mora Licuado en Agua',
    category: 'bebida',
    price: 3000,
    isHealthy: true,
    seals: [],
    ingredients: ['Mora fresca', 'Agua pura', 'Una pizca de miel orgánica'],
    allergens: [],
    image: '🥤'
  },
  {
    id: 'f4',
    name: 'Sándwich Premium de Jamón y Queso',
    category: 'plato_fuerte',
    price: 5500,
    isHealthy: true,
    seals: [],
    ingredients: ['Pan integral multifibra', 'Jamón bajo en sodio', 'Queso campesino', 'Lechuga', 'Tomate'],
    allergens: ['gluten', 'lácteos'],
    image: '🥪'
  },
  {
    id: 'f5',
    name: 'Gaseosa Coca-Cola Original (Mini)',
    category: 'bebida',
    price: 2500,
    isHealthy: false,
    seals: ['azucar', 'calorias'],
    ingredients: ['Agua carbonatada', 'Azúcar añadido', 'Cafeína', 'Sabores artificiales'],
    allergens: [],
    image: '🥫'
  },
  {
    id: 'f6',
    name: 'Papas Fritas de Paquete Margarita',
    category: 'snack',
    price: 3000,
    isHealthy: false,
    seals: ['sodio', 'grasas'],
    ingredients: ['Papa seleccionada', 'Aceite vegetal hidrogenado', 'Sal en exceso'],
    allergens: [],
    image: '🍟'
  },
  {
    id: 'f7',
    name: 'Porción de Fruta Picada (Mango Calima)',
    category: 'fruta',
    price: 2500,
    isHealthy: true,
    seals: [],
    ingredients: ['Mango calima fresco picado', 'Limón'],
    allergens: [],
    image: '🥭'
  },
  {
    id: 'f8',
    name: 'Galletas de Avena y Arándanos',
    category: 'snack',
    price: 2000,
    isHealthy: true,
    seals: [],
    ingredients: ['Avena en hojuelas', 'Arándanos secos', 'Miel', 'Huevo'],
    allergens: ['gluten', 'huevo'],
    image: '🍪'
  },
  {
    id: 'f9',
    name: 'Yogur de Fresa Regenerativo',
    category: 'bebida',
    price: 3200,
    isHealthy: true,
    seals: [],
    ingredients: ['Leche entera pasteurizada', 'Prebióticos', 'Pulpa de fresa seleccionada'],
    allergens: ['lácteos'],
    image: '🥛'
  },
  {
    id: 'f10',
    name: 'Chocolatina Jet Tradicional',
    category: 'snack',
    price: 1800,
    isHealthy: false,
    seals: ['azucar', 'grasas'],
    ingredients: ['Azúcar', 'Mantecas vegetales', 'Sólidos de leche', 'Cacao'],
    allergens: ['lácteos', 'soya'],
    image: '🍫'
  }
];

export const INITIAL_CHILDREN: Child[] = [
  {
    id: 'c1',
    name: 'Mateo González',
    grade: '3° de Primaria',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    balance: 45000,
    dailySpendLimit: 10000,
    allergens: ['huevo'],
    restrictedCategories: ['snack-chatarra'],
    selectedLunchbox: {
      'Lunes': ['f1', 'f8'], // Salpicon + Galletas avena
      'Martes': ['f4', 'f3'], // Sandwich + Jugo mora
      'Miércoles': ['f7', 'f9'], // Mango + Yogur
      'Jueves': ['f2', 'f3'], // Arepa + Jugo mora
      'Viernes': ['f4', 'f1'] // Sandwich + Salpicon
    }
  },
  {
    id: 'c2',
    name: 'Isabella González',
    grade: 'Transición B',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    balance: 18500,
    dailySpendLimit: 7000,
    allergens: ['lácteos'],
    restrictedCategories: ['alto-en-azucar'],
    selectedLunchbox: {
      'Lunes': ['f1', 'f8'], // Salpicon + Galletas avena
      'Martes': ['f7', 'f3'], // Mango + Jugo mora
      'Miércoles': ['f1', 'f8'], // Salpicon + Galletas avena
      'Jueves': ['f7', 'f3'], // Mango + Jugo mora
      'Viernes': ['f1', 'f8'] // Salpicon + Galletas
    }
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    childId: 'c1',
    childName: 'Mateo González',
    date: '2026-05-18T09:45:00Z',
    items: ['Salpicón de Frutas Natural', 'Galletas de Avena y Arándanos'],
    total: 5500,
    type: 'compra',
    status: 'completado'
  },
  {
    id: 't2',
    childId: 'c1',
    childName: 'Mateo González',
    date: '2026-05-18T07:15:00Z',
    items: [],
    total: 30000,
    type: 'recarga',
    status: 'completado'
  },
  {
    id: 't3',
    childId: 'c2',
    childName: 'Isabella González',
    date: '2026-05-18T09:50:00Z',
    items: ['Porción de Fruta Picada', 'Jugo de Mora Licuado'],
    total: 5500,
    type: 'compra',
    status: 'completado'
  }
];
