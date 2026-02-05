# 🚨 Correction Déploiement Vercel

## Problèmes Détectés

1. ❌ CSS non servi (erreur MIME type)
2. ❌ API routes retournent 500
3. ❌ Impossible de créer des items

## Solutions

### 1. Configuration Vercel Dashboard

Allez dans **Settings → Environment Variables** de votre projet Vercel et ajoutez :

| Nom            | Valeur                                                  |
| -------------- | ------------------------------------------------------- |
| `DATABASE_URL` | Votre URL MongoDB complète (copier depuis `.env.local`) |

**IMPORTANT** : Assurez-vous que la valeur est exactement celle qui fonctionne localement.

### 2. Re-Déployer

Après avoir ajouté `DATABASE_URL` :

```bash
git add .
git commit -m "fix: Vercel config + Prisma build"
git push
```

Vercel redéploiera automatiquement.

### 3. Vérifier les Logs

Si ça ne fonctionne toujours pas :

1. Allez dans **Deployments** sur Vercel
2. Cliquez sur le déploiement actif
3. Allez dans **Functions** → Cliquez sur une erreur `/api/items`
4. Regardez les **Logs** pour voir l'erreur exacte

**Erreur fréquente** : `PrismaClient is unable to be run in the browser` → Signifie que Prisma n'a pas été généré dans le build.

### 4. Forcer la Régénération Prisma

Si le problème persiste, ajoutez un script `postinstall` dans `package.json` :

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Puis re-commitez et re-deployez.
