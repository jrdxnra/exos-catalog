// Product types based on current app structure
export interface Product {
  id: string;
  "Item Name": string;
  "Brand": string;
  "Category": string;
  "Cost": string;
  "EXOS Part Number": string;
  "URL": string;
  "Preferred": string;
  createdAt?: any;
  updatedAt?: any;
}

// Gym cart item
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  status: "Hold" | "Waitlist" | "Pending Approval" | "Approved" | "Not Approved";
  note?: string;
  addedAt: any;
}

// Gym cart
export interface GymCart {
  gymId: string;
  items: CartItem[];
  lastUpdated: any;
}

// Available gyms from config
export const GYMS = ['MP2', 'MAT3', 'MP5', 'HMBLT', 'CRSM', 'TM3', 'MPD237'] as const;
export type GymId = typeof GYMS[number];

// Categories for filtering
export type Category = string;

// Search filters
export interface SearchFilters {
  searchTerm: string;
  category: string;
  brand: string;
  preferredOnly: boolean;
} 