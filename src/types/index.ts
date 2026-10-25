export interface Product {
  id: string;
  _id?: string; // MongoDB ID
  name: string;
  slug?: string; // Optional slug
  description: string;
  price: number;
  originalPrice?: number; // Optional
  image: string;
  images?: string[]; // Optional
  category: string;
  isSale?: boolean; // Optional
  inStock?: boolean; // Optional
  sku?: string; // Optional
  stock?: number; // Optional
  sizes?: string[]; // Available sizes (apparel: S–4XL, footwear: numeric). Empty/absent = no size options
  createdAt?: string; // ISO timestamp, used for "Newest" sorting
}

export interface CartItem {
  id: string; // Composite line id: `${product.id}::${size}` so different sizes are separate lines
  product: Product;
  quantity: number;
  size?: string; // Selected size for this line (empty when the product has no sizes)
}
