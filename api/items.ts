import { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Prisma Client Singleton pour Vercel Serverless
const prisma = new PrismaClient();

// Schema de validation pour Item
const ItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  category: z.string().min(1, "Category is required"),
  minStockThreshold: z.number().min(0),
  tags: z.array(z.string()),
  imageUrl: z.string().url(),
  description: z.string(),
  currentStock: z.number().optional(),
  status: z.enum(["OK", "LOW", "MAINTENANCE", "UNAVAILABLE"]).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
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
        const items = await prisma.item.findMany();
        return res.status(200).json(items);

      case "POST":
        const validation = ItemSchema.safeParse(req.body);

        if (!validation.success) {
          return res.status(400).json({ error: validation.error.format() });
        }

        const newItem = await prisma.item.create({
          data: validation.data,
        });
        return res.status(201).json(newItem);

      case "PUT": // Update complet ou partiel
        const { id, ...data } = req.body;
        if (!id) return res.status(400).json({ error: "ID required" });

        const updatedItem = await prisma.item.update({
          where: { id },
          data: data,
        });
        return res.status(200).json(updatedItem);

      case "DELETE":
        const { id: deleteId } = req.query;
        if (!deleteId || typeof deleteId !== "string")
          return res.status(400).json({ error: "ID required" });

        await prisma.item.delete({
          where: { id: deleteId },
        });
        return res.status(200).json({ success: true });

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
