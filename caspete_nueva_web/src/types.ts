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

export interface Child {
  id: string;
  name: string;
  grade: string;
  photo: string;
  balance: number;
  dailySpendLimit: number;
  allergens: string[];
  restrictedCategories: string[]; // e.g., high sugar, soda
  selectedLunchbox: { [key: string]: string[] }; // dayOfWeek -> array of FoodItem ids
}

export interface Transaction {
  id: string;
  childId: string;
  childName: string;
  date: string;
  items: string[];
  total: number;
  type: 'compra' | 'recarga';
  status: 'completado' | 'pendiente';
}

export interface MenuDay {
  day: string; // 'Lunes', 'Martes', etc.
  items: FoodItem[];
}
