import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, CartItem, GymCart } from './types';

// Collection names - same as current app
const COLLECTIONS = {
  CATALOG: 'catalog',
  GYM_ITEMS: 'gymItems',
  GYM_CARTS: 'gymCarts' // New collection for cart system
};

class FirebaseService {
  
  // Helper function to remove undefined values from an object
  private cleanObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanObject(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }
  
  // ===== CATALOG OPERATIONS =====
  
  // Get all catalog items
  async getCatalogItems(): Promise<Product[]> {
    try {
      console.log('Fetching catalog items from Firebase...');
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.CATALOG));
      
      const items: Product[] = [];
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        } as Product);
      });
      
      console.log('Fetched', items.length, 'catalog items from Firebase');
      
      // Debug: Log the first few items to see their Preferred values
      if (items.length > 0) {
        console.log('Sample items and their Preferred values:');
        items.slice(0, 5).forEach((item, index) => {
          console.log(`Item ${index + 1}: "${item["Item Name"]}" - Preferred: "${item.Preferred}"`);
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      throw error;
    }
  }

  // Search catalog items
  async searchCatalogItems(searchTerm: string): Promise<Product[]> {
    try {
      const allItems = await this.getCatalogItems();
      
      if (!searchTerm.trim()) {
        return allItems;
      }
      
      const term = searchTerm.toLowerCase();
      return allItems.filter(item => 
        item["Item Name"]?.toLowerCase().includes(term) ||
        item["Brand"]?.toLowerCase().includes(term) ||
        item["Category"]?.toLowerCase().includes(term) ||
        item["EXOS Part Number"]?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching catalog items:', error);
      throw error;
    }
  }

  // Get unique categories
  async getCategories(): Promise<string[]> {
    try {
      const items = await this.getCatalogItems();
      const categoriesSet = new Set(items.map(item => item.Category).filter(Boolean));
      const categories = Array.from(categoriesSet);
      return categories.sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get unique brands
  async getBrands(): Promise<string[]> {
    try {
      const items = await this.getCatalogItems();
      const brandsSet = new Set(items.map(item => item.Brand).filter(Boolean));
      const brands = Array.from(brandsSet);
      return brands.sort();
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }

  // ===== CART OPERATIONS =====
  
  // Get gym cart
  async getGymCart(gymId: string): Promise<GymCart> {
    try {
      const cartDoc = await getDoc(doc(db, COLLECTIONS.GYM_CARTS, gymId));
      
      if (cartDoc.exists()) {
        return {
          gymId,
          ...cartDoc.data()
        } as GymCart;
      } else {
        // Return empty cart if none exists
        return {
          gymId,
          items: [],
          lastUpdated: new Date()
        };
      }
    } catch (error) {
      console.error('Error fetching gym cart:', error);
      throw error;
    }
  }

  // Add item to gym cart
  async addToCart(gymId: string, product: Product, quantity: number = 1, note?: string): Promise<void> {
    try {
      console.log('Adding to cart:', { gymId, productId: product.id, quantity, note });
      
      // Validate required fields
      if (!product.id) {
        throw new Error('Product ID is required');
      }
      if (!gymId) {
        throw new Error('Gym ID is required');
      }
      
      const cart = await this.getGymCart(gymId);
      
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        cart.items[existingItemIndex].quantity += quantity;
        if (note) {
          cart.items[existingItemIndex].note = note;
        }
      } else {
        // Add new item to cart - clean the product data and use Date instead of serverTimestamp
        const cleanProduct: Product = {
          id: product.id,
          "Item Name": product["Item Name"] || "",
          "Brand": product.Brand || "",
          "Category": product.Category || "",
          "Cost": product.Cost || "",
          "EXOS Part Number": product["EXOS Part Number"] || "",
          "URL": product.URL || "",
          "Preferred": product.Preferred || ""
        };
        
        const newItem: CartItem = {
          productId: product.id,
          product: cleanProduct,
          quantity,
          status: "Pending Approval",
          addedAt: new Date()
        };
        
        // Only add note if it exists
        if (note && note.trim()) {
          newItem.note = note;
        }
        cart.items.push(newItem);
      }
      
      cart.lastUpdated = new Date();
      
      // Clean the cart object to remove any undefined values
      const cleanedCart = this.cleanObject(cart);
      
      // Debug: Log the cart data before saving
      console.log('Cart data being saved to Firebase:', JSON.stringify(cleanedCart, null, 2));
      
      // Save updated cart
      await setDoc(doc(db, COLLECTIONS.GYM_CARTS, gymId), cleanedCart);
      
      console.log(`Added ${product["Item Name"]} to ${gymId} cart`);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItemQuantity(gymId: string, productId: string, quantity: number): Promise<void> {
    try {
      const cart = await this.getGymCart(gymId);
      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
        
        cart.lastUpdated = new Date();
        const cleanedCart = this.cleanObject(cart);
        await setDoc(doc(db, COLLECTIONS.GYM_CARTS, gymId), cleanedCart);
      }
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart(gymId: string, productId: string): Promise<void> {
    try {
      const cart = await this.getGymCart(gymId);
      cart.items = cart.items.filter(item => item.productId !== productId);
      cart.lastUpdated = new Date();
      
      const cleanedCart = this.cleanObject(cart);
      await setDoc(doc(db, COLLECTIONS.GYM_CARTS, gymId), cleanedCart);
      
      console.log(`Removed item from ${gymId} cart`);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  // Clear gym cart
  async clearCart(gymId: string): Promise<void> {
    try {
      const emptyCart: GymCart = {
        gymId,
        items: [],
        lastUpdated: new Date()
      };
      
      const cleanedCart = this.cleanObject(emptyCart);
      await setDoc(doc(db, COLLECTIONS.GYM_CARTS, gymId), cleanedCart);
      console.log(`Cleared ${gymId} cart`);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // ===== APPROVAL WORKFLOW OPERATIONS =====
  
  // Submit cart for approval by saving to GYM_ITEMS collection
  async submitCartForApproval(gymId: string): Promise<void> {
    try {
      console.log('Starting cart submission for approval...');
      
      // Get the current cart
      const cart = await this.getGymCart(gymId);
      
      if (!cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty - nothing to submit');
      }
      
      // Prepare items for approval workflow
      const approvalItems = cart.items.map(cartItem => ({
        "Item Name": cartItem.product["Item Name"],
        "Brand": cartItem.product.Brand,
        "Category": cartItem.product.Category,
        "Cost": cartItem.product.Cost,
        "EXOS Part Number": cartItem.product["EXOS Part Number"],
        "URL": cartItem.product.URL,
        "Gym": gymId,
        "Quantity": cartItem.quantity,
        "Status": cartItem.status,
        "Note": cartItem.note || "",
        "Justification": cartItem.note || "", // Use the note as justification
        "Notes": "",
        "submittedBy": "Coach", // Track who submitted
        "submittedAt": new Date()
      }));
      
      // Save to GYM_ITEMS collection for approval workflow
      const batch = writeBatch(db);
      
      approvalItems.forEach(item => {
        const docRef = doc(collection(db, COLLECTIONS.GYM_ITEMS));
        batch.set(docRef, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      
      console.log(`Successfully submitted ${approvalItems.length} items for approval`);
      
      // Clear the cart after successful submission
      await this.clearCart(gymId);
      
    } catch (error) {
      console.error('Error submitting cart for approval:', error);
      throw error;
    }
  }

  // Get all saved carts for approval workflow
  async getAllSavedCarts(): Promise<any[]> {
    try {
      const cartsRef = collection(db, COLLECTIONS.GYM_CARTS);
      const querySnapshot = await getDocs(cartsRef);
      
      const allCartItems: any[] = [];
      
      querySnapshot.docs.forEach(doc => {
        const cartData = doc.data();
        if (cartData.items && cartData.items.length > 0) {
          cartData.items.forEach((item: any, index: number) => {
            allCartItems.push({
              id: `${doc.id}_${index}`,
              cartId: doc.id,
              gymId: doc.id, // The document ID is the gym ID
              itemIndex: index,
              ...item,
              // Add approval status if not present
              approvalStatus: item.approvalStatus || 'pending',
              submittedForApproval: item.submittedForApproval || false
            });
          });
        }
      });
      
      console.log(`Fetched ${allCartItems.length} cart items for approval`);
      return allCartItems;
    } catch (error) {
      console.error('Error fetching saved carts:', error);
      throw error;
    }
  }

  // Submit specific cart items for approval
  async submitCartItemsForApproval(
    cartItems: any[], 
    justification: string, 
    notes?: string, 
    gymId?: string,
    individualEdits?: Record<number, { justification: string; notes: string }>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const individualEdit = individualEdits?.[i];
        
        // Create approval item in GYM_ITEMS collection
        const approvalData = {
          "Item Name": item.product["Item Name"],
          "Brand": item.product.Brand,
          "Category": item.product.Category,
          "Cost": item.product.Cost,
          "EXOS Part Number": item.product["EXOS Part Number"],
          "URL": item.product.URL,
          "Gym": gymId || item.gymId,
          "Quantity": item.quantity,
          "Status": "Pending Approval",
          "Note": item.note || "",
          "Justification": individualEdit?.justification || item.justification || justification,
          "Notes": individualEdit?.notes || item.notes || notes || "",
          "submittedBy": "Coach",
          "submittedAt": serverTimestamp(),
          "createdAt": serverTimestamp(),
          "updatedAt": serverTimestamp()
        };
        
        const approvalRef = doc(collection(db, COLLECTIONS.GYM_ITEMS));
        batch.set(approvalRef, this.cleanObject(approvalData));
      }
      
      await batch.commit();
      console.log(`Successfully submitted ${cartItems.length} items for approval`);
    } catch (error) {
      console.error('Error submitting cart items for approval:', error);
      throw error;
    }
  }

  // Get all gym items for approval workflow
  async getGymItems(): Promise<any[]> {
    try {
      console.log('Fetching gym items from Firebase...');
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.GYM_ITEMS));
      
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Fetched', items.length, 'gym items from Firebase');
      return items;
    } catch (error) {
      console.error('Error fetching gym items:', error);
      throw error;
    }
  }

  // Update gym item status
  async updateGymItemStatus(itemId: string, newStatus: string, managerNote?: string): Promise<void> {
    try {
      const itemRef = doc(db, COLLECTIONS.GYM_ITEMS, itemId);
      const updateData: any = {
        Status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (managerNote) {
        updateData.managerNote = managerNote;
        updateData.managerDecisionDate = serverTimestamp();
      }
      
      await updateDoc(itemRef, updateData);
      
      console.log(`Updated item ${itemId} status to ${newStatus}`);
    } catch (error) {
      console.error('Error updating gym item status:', error);
      throw error;
    }
  }

  // Update gym item details (notes, etc.)
  async updateGymItemDetails(itemId: string, updatedFields: any): Promise<void> {
    try {
      const itemRef = doc(db, COLLECTIONS.GYM_ITEMS, itemId);
      const updateData = {
        ...updatedFields,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(itemRef, this.cleanObject(updateData));
      
      console.log(`Updated item ${itemId} details`);
    } catch (error) {
      console.error('Error updating gym item details:', error);
      throw error;
    }
  }

  // Update cart item details (for saved carts)
  async updateCartItemDetails(gymId: string, productId: string, updatedFields: any): Promise<void> {
    try {
      const cartRef = doc(db, COLLECTIONS.GYM_CARTS, gymId);
      const cartDoc = await getDoc(cartRef);
      
      if (cartDoc.exists()) {
        const cartData = cartDoc.data();
        if (cartData.items) {
          const updatedItems = cartData.items.map((item: any) =>
            item.productId === productId
              ? { ...item, ...updatedFields }
              : item
          );
          
          await updateDoc(cartRef, {
            items: updatedItems,
            updatedAt: new Date()
          });
          
          console.log(`Updated cart item ${productId} in gym ${gymId}`);
        }
      }
    } catch (error) {
      console.error('Error updating cart item details:', error);
      throw error;
    }
  }
}

const firebaseService = new FirebaseService();
export default firebaseService; 