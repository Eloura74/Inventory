import { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Prisma Client Singleton pour Vercel Serverless
const prisma = new PrismaClient();

const MovementSchema = z.object({
  type: z.enum(["IN", "OUT", "TRANSFER", "ADJUST"]),
  quantity: z.number().int().positive(),
  itemId: z.string(),
  fromLocationId: z.string().optional().nullable(),
  toLocationId: z.string().optional().nullable(),
  note: z.string().optional(),
  // Pour l'instant on simule le user ID, à remplacer par auth réelle
  createdById: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case "GET":
        // Récupérer les 50 derniers mouvements avec relations
        const movements = await prisma.movement.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            item: true,
            fromLocation: true,
            toLocation: true,
            createdBy: true,
          },
        });
        return res.status(200).json(movements);

      case "POST":
        const validation = MovementSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: validation.error.format() });
        }

        const {
          itemId,
          quantity,
          type,
          fromLocationId,
          toLocationId,
          createdById_MOCK,
        } = req.body;

        // Transaction: Créer le mouvement ET mettre à jour le stock
        const result = await prisma.$transaction(async (tx) => {
          // 1. Créer le mouvement
          // Note: Il nous faut un User ID valide dans la DB pour la FK.
          // Pour le MVP, on essaie de trouver un admin ou on en crée un par défaut
          let user = await tx.user.findFirst();
          if (!user) {
            user = await tx.user.create({
              data: {
                email: "admin@stockflow.pro",
                name: "System Admin",
                role: "ADMIN",
              },
            });
          }

          const movement = await tx.movement.create({
            data: {
              type,
              quantity,
              note: req.body.note,
              itemId,
              fromLocationId: fromLocationId || undefined,
              toLocationId: toLocationId || undefined,
              createdById: user.id,
            },
          });

          // 2. Mettre à jour le stock de l'item
          let stockChange = 0;
          if (type === "IN") stockChange = quantity;
          if (type === "OUT") stockChange = -quantity;
          // Transfert ne change pas le stock total de l'item, mais change sa localisation
          // Pour l'instant notre modele Item a un "currentStock" global.
          // Si on voulait un stock par location, il faudrait un model ItemStock(itemId, locationId, qty).
          // Pour ce MVP simple, on gère le stock global.

          if (stockChange !== 0) {
            const item = await tx.item.findUnique({ where: { id: itemId } });
            if (item) {
              const newStock = (item.currentStock || 0) + stockChange;

              // Mettre à jour ItemStatus
              let newStatus = item.status;
              if (newStock <= item.minStockThreshold) newStatus = "LOW";
              if (newStock > item.minStockThreshold) newStatus = "OK";
              if (newStock <= 0) newStatus = "UNAVAILABLE"; // Ou maintain LOW si < 0 impossible

              await tx.item.update({
                where: { id: itemId },
                data: {
                  currentStock: newStock,
                  status: newStatus,
                },
              });
            }
          }

          return movement;
        });

        return res.status(201).json(result);

      default:
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
