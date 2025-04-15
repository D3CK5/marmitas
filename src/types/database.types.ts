export type Product = {
  id: number;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: number | null;
  images: string[];
  nutritional_info: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    fiber: number;
    sodium: number;
  } | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
} 