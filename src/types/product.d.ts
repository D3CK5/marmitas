interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: number | null;
  images: string[];
  nutritional_info?: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    fiber: number;
    sodium: number;
  } | null;
  allows_food_changes: boolean;
  changeable_foods?: {
    id: number;
    default_food: {
      id: number;
      name: string;
    };
  }[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Tipo para criação de produto
type CreateProductInput = Omit<Product, 
  'id' | 
  'created_at' | 
  'updated_at' | 
  'deleted_at' | 
  'changeable_foods'
>; 