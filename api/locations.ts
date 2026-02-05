import { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Prisma Client Singleton pour Vercel Serverless
const prisma = new PrismaClient();

const LocationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["WAREHOUSE", "ZONE", "RACK", "EVENT", "CLIENT", "ROOM"]),
  parentId: z.string().optional().nullable(),
  address: z.string().optional(),
  contactInfo: z.string().optional(),
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
        const locations = await prisma.location.findMany();
        return res.status(200).json(locations);

      case "POST":
        const validation = LocationSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: validation.error.format() });
        }
        const newLocation = await prisma.location.create({
          data: validation.data,
        });
        return res.status(201).json(newLocation);

      case "DELETE":
        const { id } = req.query;
        if (!id || typeof id !== "string")
          return res.status(400).json({ error: "ID required" });

        await prisma.location.delete({
          where: { id },
        });
        return res.status(200).json({ success: true });

      default:
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
