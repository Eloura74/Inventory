# 🚀 Déploiement Fullstack : StockFlow Pro + MongoDB + Vercel

Votre application est maintenant **Fullstack Serverless**. Elle utilise :

- **Frontend** : React (Vite)
- **Backend** : Vercel Serverless Functions (`/api`)
- **Database** : MongoDB Atlas (via Prisma)

---

## 1. Préparation de la Base de Données (MongoDB Atlas)

1.  Créez un clust sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Dans "Network Access", autorisez l'IP `0.0.0.0/0` (pour que Vercel puisse s'y connecter).
3.  Récupérez votre "Connection String" (SRV).
4.  Créez un fichier `.env` à la racine du projet localement :
    ```env
    DATABASE_URL="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/stockflow?retryWrites=true&w=majority"
    ```
5.  Poussez le schéma vers la base de données :
    ```bash
    npx prisma db push
    ```

---

## 2. Test Local (Fullstack)

Pour tester l'API serverless localement, **n'utilisez pas `npm run dev`** (qui ne lance que Vite). Utilisez Vercel CLI :

```bash
npm install -g vercel
vercel dev
```

Cela lancera le frontend ET l'API sur `http://localhost:3000`.

---

## 3. Déploiement sur Vercel

1.  Poussez votre code sur GitHub.
2.  Importez le projet sur Vercel dashboard.
3.  Dans les **Settings > Environment Variables** du projet Vercel, ajoutez :
    - `DATABASE_URL` : Votre connection string MongoDB.
4.  Lancez le déploiement. Vercel détectera la configuration et déploiera automatiquement Frontend et Serverless Functions.

---

## ✅ Vérification

Une fois déployé :

1.  Ouvrez l'app.
2.  Ajoutez un Item.
3.  Vérifiez dans MongoDB Atlas (Collections) que l'item a été créé dans la collection `Item`.
