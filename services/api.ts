import { Item, Location, MovementType, StockMovement, Comment } from "../types";

const API_BASE = "/api";

const headers = {
  "Content-Type": "application/json",
};

export const api = {
  items: {
    list: async (): Promise<Item[]> => {
      const res = await fetch(`${API_BASE}/items`, { headers });
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
    create: async (data: Partial<Item>): Promise<Item> => {
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create item");
      return res.json();
    },
    update: async (id: string, data: Partial<Item>): Promise<Item> => {
      const res = await fetch(`${API_BASE}/items`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/items?id=${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete item");
    },
  },

  locations: {
    list: async (): Promise<Location[]> => {
      const res = await fetch(`${API_BASE}/locations`, { headers });
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json();
    },
    create: async (data: Partial<Location>): Promise<Location> => {
      const res = await fetch(`${API_BASE}/locations`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create location");
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/locations?id=${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete location");
    },
  },

  movements: {
    list: async (): Promise<StockMovement[]> => {
      const res = await fetch(`${API_BASE}/movements`, { headers });
      if (!res.ok) throw new Error("Failed to fetch movements");
      return res.json();
    },
    create: async (data: {
      type: MovementType;
      quantity: number;
      itemId: string;
      fromLocationId?: string;
      toLocationId?: string;
      note?: string;
    }): Promise<StockMovement> => {
      const res = await fetch(`${API_BASE}/movements`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create movement");
      return res.json();
    },
  },

  comments: {
    list: async (): Promise<Comment[]> => {
      const res = await fetch(`${API_BASE}/comments`, { headers });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    create: async (data: {
      text: string;
      entityType: "ITEM" | "MOVEMENT" | "LOCATION";
      entityId: string;
    }): Promise<Comment> => {
      const res = await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/comments?id=${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
  },
};
