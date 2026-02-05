import { Item, Location, StockMovement, User, Role, MovementType, Comment } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Admin', email: 'alice@stockflow.com', role: Role.ADMIN, avatar: 'https://picsum.photos/id/64/100/100' },
  { id: 'u2', name: 'Bob Manager', email: 'bob@stockflow.com', role: Role.MANAGER, avatar: 'https://picsum.photos/id/65/100/100' },
];

export const MOCK_LOCATIONS: Location[] = [
  { id: 'loc_main', name: 'Main Warehouse', type: 'WAREHOUSE' },
  { id: 'loc_z1', name: 'Zone A (Cameras)', type: 'ZONE', parentId: 'loc_main' },
  { id: 'loc_z2', name: 'Zone B (Audio)', type: 'ZONE', parentId: 'loc_main' },
  { id: 'loc_ext', name: 'External Event: TechConf 2024', type: 'EVENT' },
];

export const MOCK_ITEMS: Item[] = [
  { 
    id: 'it_1', name: 'Sony Alpha a7S III', brand: 'Sony', model: 'ILCE7SM3', category: 'Camera', 
    minStockThreshold: 2, tags: ['4k', 'mirrorless', 'high-demand'], 
    imageUrl: 'https://picsum.photos/id/250/200/200',
    description: 'Full-frame mirrorless camera optimized for video.'
  },
  { 
    id: 'it_2', name: 'Sennheiser MKH 416', brand: 'Sennheiser', model: 'MKH 416', category: 'Audio', 
    minStockThreshold: 3, tags: ['shotgun', 'microphone', 'boom'], 
    imageUrl: 'https://picsum.photos/id/145/200/200',
    description: 'Industry standard shotgun microphone.'
  },
  { 
    id: 'it_3', name: 'Blackmagic ATEM Mini Pro', brand: 'Blackmagic', model: 'SWATEMMINIBPR', category: 'Video Switcher', 
    minStockThreshold: 1, tags: ['streaming', 'switcher'], 
    imageUrl: 'https://picsum.photos/id/3/200/200',
    description: 'HDMI Live Stream Switcher.'
  },
  { 
    id: 'it_4', name: 'HDMI Cable 10m', brand: 'Generic', model: 'HDMI-10', category: 'Cables', 
    minStockThreshold: 10, tags: ['cable', 'hdmi'], 
    imageUrl: 'https://picsum.photos/id/2/200/200',
    description: 'High speed HDMI cable, braided.'
  },
  { 
    id: 'it_5', name: 'Manfrotto 504X Tripod', brand: 'Manfrotto', model: '504X', category: 'Support', 
    minStockThreshold: 4, tags: ['tripod', 'stable'], 
    imageUrl: 'https://picsum.photos/id/1/200/200',
    description: 'Fluid video head with aluminum legs.'
  }
];

// Initial movement history to establish stock
export const MOCK_MOVEMENTS: StockMovement[] = [
  { id: 'mv_1', itemId: 'it_1', type: MovementType.IN, quantity: 5, toLocationId: 'loc_z1', createdAt: '2023-10-01T10:00:00Z', createdBy: 'u1', note: 'Initial Purchase' },
  { id: 'mv_2', itemId: 'it_2', type: MovementType.IN, quantity: 8, toLocationId: 'loc_z2', createdAt: '2023-10-01T10:30:00Z', createdBy: 'u1' },
  { id: 'mv_3', itemId: 'it_3', type: MovementType.IN, quantity: 3, toLocationId: 'loc_main', createdAt: '2023-10-02T09:00:00Z', createdBy: 'u1' },
  { id: 'mv_4', itemId: 'it_4', type: MovementType.IN, quantity: 50, toLocationId: 'loc_main', createdAt: '2023-10-02T09:15:00Z', createdBy: 'u1' },
  { id: 'mv_5', itemId: 'it_5', type: MovementType.IN, quantity: 10, toLocationId: 'loc_z1', createdAt: '2023-10-03T11:00:00Z', createdBy: 'u1' },
  // Some operational movements
  { id: 'mv_6', itemId: 'it_1', type: MovementType.OUT, quantity: 2, fromLocationId: 'loc_z1', toLocationId: 'loc_ext', createdAt: '2023-10-25T14:00:00Z', createdBy: 'u2', note: 'Sent to TechConf' },
  { id: 'mv_7', itemId: 'it_4', type: MovementType.OUT, quantity: 5, fromLocationId: 'loc_main', toLocationId: 'loc_ext', createdAt: '2023-10-25T14:05:00Z', createdBy: 'u2' },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', entityType: 'ITEM', entityId: 'it_1', text: 'Lens cap missing on one unit.', createdAt: '2023-10-20T10:00:00Z', createdBy: 'u2', authorName: 'Bob Manager' },
];
