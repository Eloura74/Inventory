# 🔍 Diagnostic Erreurs Vercel - Checklist

## ❌ Symptômes Actuels

- ✅ Build réussi (Prisma 6 OK)
- ❌ CSS servi en `text/plain` au lieu de `text/css`
- ❌ API routes retournent 500 (toutes)
- ❌ Impossible de créer des items

---

## 🔧 Étape 1 : Vérifier DATABASE_URL sur Vercel

**CRITIQUE** : Allez sur Vercel Dashboard

1. Ouvrez votre projet `Inventory`
2. **Settings → Environment Variables**
3. **Vérifiez** : Y a-t-il une variable `DATABASE_URL` ?

### Si OUI (variable existe) :

- Vérifiez que la valeur est **identique** à celle de votre `.env.local` local
- Redéployez : **Deployments → ... (menu) → Redeploy**

### Si NON (variable n'existe pas) :

**C'EST LE PROBLÈME !**

1. Cliquez **Add**
2. **Name** : `DATABASE_URL`
3. **Value** : Copiez EXACTEMENT depuis votre `.env.local`
4. **Environment** : Cochez `Production`, `Preview`, `Development`
5. Cliquez **Save**
6. Redéployez

---

## 🔧 Étape 2 : Diagnostic Avancé (Si DATABASE_URL existe déjà)

### Voir les Logs de Functions :

1. **Deployments** → Cliquez sur le dernier déploiement
2. **Functions** → Cliquez sur `/api/items`
3. **Logs** → Regardez l'erreur exacte

Erreurs fréquentes :

- `PrismaClient is unable to run in browser` → Prisma mal généré
- `Error connecting to database` → Mauvaise DATABASE_URL ou IP non autorisée
- `Cannot find module` → Dépendance manquante

**Copiez l'erreur ici** et je vous dirai comment la corriger.

---

## 🎯 Correction CSS (à faire après)

Une fois l'API fixée, je corrigerai le problème de CSS MIME type.
