import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";

// Charger explicitement .env.local
config({ path: path.join(process.cwd(), ".env.local") });

// Debug pour voir si l'URL est chargée (sans l'afficher en entier pour sécu)
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ ERREUR: DATABASE_URL n'est pas définie dans .env.local");
  process.exit(1);
}
console.log(`✅ DATABASE_URL chargée (longueur: ${dbUrl.length})`);

// Initialisation Standard
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du Seed...");

  // 1. Create User (Admin)
  const admin = await prisma.user.upsert({
    where: { email: "quentin@stockflow.pro" },
    update: {},
    create: {
      email: "quentin@stockflow.pro",
      name: "Quentin",
      role: "ADMIN",
      avatar: "https://ui-avatars.com/api/?name=Quentin&background=random",
    },
  });
  console.log("👤 Utilisateur Admin:", admin.name);

  // 2. Create Locations
  const warehouse = await prisma.location.create({
    data: {
      name: "Entrepôt Principal",
      type: "WAREHOUSE",
      address: "123 Rue de la Logistique",
    },
  });

  const studio = await prisma.location.create({
    data: {
      name: "Studio Photo Alpha",
      type: "ROOM",
      contactInfo: "Responsable Studio",
    },
  });

  console.log("📍 Locations créées");

  // 3. Create Items
  const itemsData = [
    {
      name: "Sony A7 III",
      brand: "Sony",
      model: "ILCE-7M3",
      category: "Camera",
      minStockThreshold: 2,
      currentStock: 5,
      status: "OK",
      imageUrl:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80",
      description: "Boîtier hybride plein format 24MP",
      tags: ["Photo", "Video", "4K"],
    },
    {
      name: "MacBook Pro 16 M3",
      brand: "Apple",
      model: "M3 Max",
      category: "Computer",
      minStockThreshold: 1,
      currentStock: 2,
      status: "OK",
      imageUrl:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=300&q=80",
      description: "Laptop de production principal",
      tags: ["Edit", "Dev", "Apple"],
    },
    {
      name: "DJI Ronin RS3",
      brand: "DJI",
      model: "RS3 Pro",
      category: "Stabilizer",
      minStockThreshold: 1,
      currentStock: 0,
      status: "UNAVAILABLE",
      imageUrl:
        "https://images.unsplash.com/photo-1588483977959-badc98929114?auto=format&fit=crop&w=300&q=80",
      description: "Stabilisateur 3 axes pro",
      tags: ["Video", "Gimbal"],
    },
    {
      name: "Canon 24-70mm f/2.8",
      brand: "Canon",
      model: "L Series II",
      category: "Lens",
      minStockThreshold: 2,
      currentStock: 3,
      status: "LOW",
      imageUrl:
        "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=300&q=80",
      description: "Objectif zoom standard versatile",
      tags: ["Photo", "Lens"],
    },
  ];

  for (const item of itemsData) {
    // @ts-ignore
    await prisma.item.create({ data: item });
  }

  console.log("📦 Items créés");
  console.log("✨ Seed terminé avec succès !");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
