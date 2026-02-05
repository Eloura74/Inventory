import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";

// Charger les variables d'environnement
config({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Créer des utilisateurs
  console.log("👥 Creating users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Quentin Faber",
        email: "quentin@stockflow.pro",
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sophie Martin",
        email: "sophie.martin@stockflow.pro",
        role: "MANAGER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Lucas Dubois",
        email: "lucas.dubois@stockflow.pro",
        role: "VIEWER",
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // 2. Créer des locations
  console.log("📍 Creating locations...");
  const locations = await Promise.all([
    // Entrepôts
    prisma.location.create({
      data: {
        name: "Entrepôt Central Paris",
        type: "WAREHOUSE",
        address: "12 Rue de Rivoli, 75001 Paris",
      },
    }),
    prisma.location.create({
      data: {
        name: "Entrepôt Lyon",
        type: "WAREHOUSE",
        address: "45 Avenue Jean Jaurès, 69007 Lyon",
      },
    }),
    // Zones internes
    prisma.location.create({
      data: {
        name: "Zone Stockage Audio",
        type: "ZONE",
        address: "Entrepôt Paris - Aile A",
      },
    }),
    prisma.location.create({
      data: {
        name: "Zone Stockage Vidéo",
        type: "ZONE",
        address: "Entrepôt Paris - Aile B",
      },
    }),
    // Clients / Événements
    prisma.location.create({
      data: {
        name: "Client - TechConf 2026",
        type: "EVENT",
        address: "Palais des Congrès, Paris",
      },
    }),
    prisma.location.create({
      data: {
        name: "Client - MusicFest Live",
        type: "CLIENT",
        address: "Zenith de Paris",
      },
    }),
    prisma.location.create({
      data: {
        name: "Salle de Réunion A",
        type: "ROOM",
        address: "Siège social - Étage 2",
      },
    }),
  ]);
  console.log(`✅ Created ${locations.length} locations`);

  // 3. Créer des items
  console.log("📦 Creating items...");
  const items = await Promise.all([
    // Audio
    prisma.item.create({
      data: {
        name: "Micro Sans Fil Shure SM58",
        brand: "Shure",
        model: "SM58-LC",
        category: "Audio",
        minStockThreshold: 5,
        currentStock: 12,
        tags: ["micro", "sans-fil", "vocal"],
        imageUrl:
          "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400",
        description:
          "Microphone dynamique cardioïde sans fil, idéal pour le chant live et les présentations. Robuste et fiable.",
      },
    }),
    prisma.item.create({
      data: {
        name: "Console de Mixage Yamaha",
        brand: "Yamaha",
        model: "MG16XU",
        category: "Audio",
        minStockThreshold: 2,
        currentStock: 4,
        tags: ["console", "mixage", "table de mix"],
        imageUrl:
          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400",
        description:
          "Console de mixage 16 canaux avec effets intégrés et interface USB.",
      },
    }),
    prisma.item.create({
      data: {
        name: "Enceinte Active JBL",
        brand: "JBL",
        model: "EON615",
        category: "Audio",
        minStockThreshold: 4,
        currentStock: 8,
        tags: ["enceinte", "sono", "amplifiée"],
        imageUrl:
          "https://images.unsplash.com/photo-1545486332-9e0999c535b2?w=400",
        description: 'Enceinte active 15" 1000W, portable et polyvalente.',
      },
    }),
    // Vidéo
    prisma.item.create({
      data: {
        name: "Caméra Sony 4K",
        brand: "Sony",
        model: "PXW-Z90",
        category: "Vidéo",
        minStockThreshold: 3,
        currentStock: 5,
        tags: ["caméra", "4K", "broadcast"],
        imageUrl:
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400",
        description:
          "Caméra professionnelle 4K avec zoom optique 12x et stabilisation avancée.",
      },
    }),
    prisma.item.create({
      data: {
        name: "Projecteur LED Epson",
        brand: "Epson",
        model: "EB-L200F",
        category: "Vidéo",
        minStockThreshold: 2,
        currentStock: 3,
        tags: ["projecteur", "laser", "présentation"],
        imageUrl:
          "https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?w=400",
        description: "Projecteur laser Full HD 4500 lumens, sans lampe.",
      },
    }),
    // Éclairage
    prisma.item.create({
      data: {
        name: "Lyre Moving Head LED",
        brand: "ADJ",
        model: "Focus Spot 4Z",
        category: "Éclairage",
        minStockThreshold: 6,
        currentStock: 10,
        tags: ["lyre", "moving head", "LED", "éclairage scène"],
        imageUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
        description:
          "Lyre motorisée LED avec zoom 7-40°, rotation pan/tilt rapide.",
      },
    }),
    prisma.item.create({
      data: {
        name: "Projecteur PAR LED 64",
        brand: "Chauvet",
        model: "SlimPAR 64 RGBA",
        category: "Éclairage",
        minStockThreshold: 8,
        currentStock: 15,
        tags: ["par", "LED", "RGB", "wash"],
        imageUrl:
          "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400",
        description:
          "Projecteur LED compact RGBA, idéal pour wash de couleurs.",
      },
    }),
    // Accessoires
    prisma.item.create({
      data: {
        name: "Câble XLR 10m",
        brand: "ProCab",
        model: "XLR-10",
        category: "Câbles",
        minStockThreshold: 20,
        currentStock: 45,
        tags: ["câble", "XLR", "audio"],
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
        description: "Câble XLR mâle/femelle 10 mètres, blindage pro.",
      },
    }),
    prisma.item.create({
      data: {
        name: "Multipaire 16 canaux",
        brand: "Sommercable",
        model: "SC-ORBIT 240",
        category: "Câbles",
        minStockThreshold: 3,
        currentStock: 5,
        tags: ["multipaire", "snake", "scène"],
        imageUrl:
          "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=400",
        description: "Multipaire 16 voies XLR 25m avec boîtier de scène.",
      },
    }),
    prisma.item.create({
      data: {
        name: "Flight Case Rack 4U",
        brand: "Thomann",
        model: "Rack Case 4U",
        category: "Flight Cases",
        minStockThreshold: 5,
        currentStock: 7,
        tags: ["flight case", "rack", "transport"],
        imageUrl:
          "https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400",
        description: "Flight case rack 4 unités, renforcé pour le transport.",
      },
    }),
  ]);
  console.log(`✅ Created ${items.length} items`);

  // 4. Créer des mouvements
  console.log("🔄 Creating movements...");
  const movements = await Promise.all([
    // Entrées
    prisma.movement.create({
      data: {
        type: "IN",
        item: { connect: { id: items[0].id } },
        quantity: 5,
        toLocation: { connect: { id: locations[0].id } },
        createdBy: { connect: { id: users[0].id } },
        note: "Réception livraison fournisseur - Commande #2024-156",
      },
    }),
    prisma.movement.create({
      data: {
        type: "IN",
        item: { connect: { id: items[1].id } },
        quantity: 2,
        toLocation: { connect: { id: locations[0].id } },
        createdBy: { connect: { id: users[1].id } },
        note: "Retour SAV Yamaha - Réparation effectuée",
      },
    }),
    // Sorties
    prisma.movement.create({
      data: {
        type: "OUT",
        item: { connect: { id: items[3].id } },
        quantity: 2,
        fromLocation: { connect: { id: locations[0].id } },
        createdBy: { connect: { id: users[2].id } },
        note: "Sortie pour événement TechConf 2026",
      },
    }),
    prisma.movement.create({
      data: {
        type: "OUT",
        item: { connect: { id: items[5].id } },
        quantity: 4,
        fromLocation: { connect: { id: locations[0].id } },
        createdBy: { connect: { id: users[2].id } },
        note: "Sortie pour MusicFest Live - Concert principal",
      },
    }),
    // Transferts
    prisma.movement.create({
      data: {
        type: "TRANSFER",
        item: { connect: { id: items[2].id } },
        quantity: 3,
        fromLocation: { connect: { id: locations[0].id } },
        toLocation: { connect: { id: locations[1].id } },
        createdBy: { connect: { id: users[1].id } },
        note: "Réallocation stock - Equilibrage entrepôts",
      },
    }),
    prisma.movement.create({
      data: {
        type: "TRANSFER",
        item: { connect: { id: items[6].id } },
        quantity: 5,
        fromLocation: { connect: { id: locations[2].id } },
        toLocation: { connect: { id: locations[3].id } },
        createdBy: { connect: { id: users[0].id } },
        note: "Réorganisation zones de stockage",
      },
    }),
    // Ajustements
    prisma.movement.create({
      data: {
        type: "ADJUST",
        item: { connect: { id: items[7].id } },
        quantity: 45,
        createdBy: { connect: { id: users[0].id } },
        note: "Inventaire annuel - Correction écart stock",
      },
    }),
  ]);
  console.log(`✅ Created ${movements.length} movements`);

  // 5. Créer des commentaires
  console.log("💬 Creating comments...");
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        entityType: "ITEM",
        entityId: items[0].id,
        text: "Micros en excellent état. Piles neuves à installer avant prochaine sortie.",
        createdBy: { connect: { id: users[2].id } },
        authorName: users[2].name,
      },
    }),
    prisma.comment.create({
      data: {
        entityType: "ITEM",
        entityId: items[3].id,
        text: "ATTENTION: Une caméra présente un problème de mise au point. À vérifier avant la prochaine location.",
        createdBy: { connect: { id: users[1].id } },
        authorName: users[1].name,
      },
    }),
    prisma.comment.create({
      data: {
        entityType: "ITEM",
        entityId: items[5].id,
        text: "Lyres nettoyées et testées. Prêtes pour le concert de samedi.",
        createdBy: { connect: { id: users[2].id } },
        authorName: users[2].name,
      },
    }),
    prisma.comment.create({
      data: {
        entityType: "ITEM",
        entityId: items[1].id,
        text: 'Console mise à jour firmware v2.5. Nouvel preset "Concert Rock" créé.',
        createdBy: { connect: { id: users[0].id } },
        authorName: users[0].name,
      },
    }),
    prisma.comment.create({
      data: {
        entityType: "MOVEMENT",
        entityId: movements[2].id,
        text: "Client très satisfait du matériel. Demande de devis pour location longue durée.",
        createdBy: { connect: { id: users[1].id } },
        authorName: users[1].name,
      },
    }),
  ]);
  console.log(`✅ Created ${comments.length} comments`);

  console.log("");
  console.log("✨ Database seeded successfully!");
  console.log("📊 Summary:");
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Locations: ${locations.length}`);
  console.log(`   - Items: ${items.length}`);
  console.log(`   - Movements: ${movements.length}`);
  console.log(`   - Comments: ${comments.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
