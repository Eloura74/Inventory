import { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Prisma Client Singleton pour Vercel Serverless
const prisma = new PrismaClient();

// Schema de validation pour Comment
const CommentSchema = z.object({
  text: z.string().min(1, "Comment text is required"),
  entityType: z.enum(["ITEM", "MOVEMENT", "LOCATION"]),
  entityId: z.string(),
  // Pour l'instant on utilise un user mocké, à remplacer par auth réelle
  createdById: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,DELETE");
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
        // Récupérer tous les commentaires avec relations
        const comments = await prisma.comment.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: true,
          },
        });
        return res.status(200).json(comments);

      case "POST":
        const validation = CommentSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: validation.error.format() });
        }

        const { text, entityType, entityId } = req.body;

        // Récupérer ou créer un user par défaut (en attendant l'auth)
        let user = await prisma.user.findFirst();
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: "admin@stockflow.pro",
              name: "System Admin",
              role: "ADMIN",
            },
          });
        }

        // Créer le commentaire avec les relations optionnelles
        const commentData: any = {
          text,
          entityType,
          entityId,
          authorName: user.name,
          createdById: user.id,
        };

        // Ajouter les relations spécifiques selon le type d'entité
        if (entityType === "ITEM") {
          commentData.itemId = entityId;
        } else if (entityType === "LOCATION") {
          commentData.locationId = entityId;
        }

        const newComment = await prisma.comment.create({
          data: commentData,
          include: {
            createdBy: true,
          },
        });

        return res.status(201).json(newComment);

      case "DELETE":
        const { id: deleteId } = req.query;
        if (!deleteId || typeof deleteId !== "string") {
          return res.status(400).json({ error: "ID required" });
        }

        await prisma.comment.delete({
          where: { id: deleteId },
        });
        return res.status(200).json({ success: true });

      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
