export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER'
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUST = 'ADJUST'
}

export enum ItemStatus {
  OK = 'OK',
  LOW = 'LOW',
  MAINTENANCE = 'MAINTENANCE',
  UNAVAILABLE = 'UNAVAILABLE'
}

export type LocationType = 'WAREHOUSE' | 'ZONE' | 'RACK' | 'EVENT' | 'CLIENT' | 'ROOM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  parentId?: string;
  address?: string; // Added for clients/venues
  contactInfo?: string; // Added for clients
}

export interface Item {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  minStockThreshold: number;
  tags: string[];
  imageUrl: string;
  description: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  createdAt: string; // ISO date
  createdBy: string; // User ID
  note?: string;
}

export interface Comment {
  id: string;
  entityType: 'ITEM' | 'MOVEMENT' | 'LOCATION';
  entityId: string;
  text: string;
  createdAt: string;
  createdBy: string; // User ID
  authorName: string;
}

// Derived type for UI display
export interface InventoryItem extends Item {
  currentStock: number;
  status: ItemStatus;
}