export interface FoodItem {
  id: string;
  name: string;
  category: 'bebida' | 'snack' | 'plato_fuerte' | 'fruta';
  price: number;
  isHealthy: boolean;
  seals: ('azucar' | 'sodio' | 'grasas' | 'calorias')[]; // Colombia Ley 2120 octagonal seals
  ingredients: string[];
  allergens: string[];
  image: string;
}

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
