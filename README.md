# SYSTEM

Application web personnelle de suivi (tracking) d'activités et de projets.
Compte unique, magic link, PWA installable, notifications push.

Stack : **Next.js (App Router, TypeScript strict) + Tailwind CSS + Supabase (PostgreSQL, Auth, RLS) + Vercel** — 100 % gratuit.

---

## 1. Installation locale

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs (section 3)
npm run dev
```

## 2. Base de données (Supabase)

1. Créer un projet sur [supabase.com](https://supabase.com) (plan Free).
2. Dans **SQL Editor**, exécuter dans l'ordre :
   - `supabase/schema.sql` — tables, RLS, compte unique, fonction citation du jour
   - `supabase/seed_quotes.sql` — les 27 citations initiales
3. Dans **Authentication → Sign In / Providers** : activer **Email** (magic link).
4. Dans **Authentication → URL Configuration** : ajouter
   `http://localhost:3000/auth/callback` et `https://<ton-domaine>/auth/callback`
   aux *Redirect URLs*.

## 3. Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (publique) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme (protégée par RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur uniquement — jamais exposée |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique Web Push |
| `VAPID_PRIVATE_KEY` | Serveur uniquement |
| `VAPID_SUBJECT` | `mailto:ton@email.com` |
| `CRON_SECRET` | Protège `/api/cron/reminders` |

Clés VAPID (une seule fois) :

```bash
npx web-push generate-vapid-keys
```

## 4. Déploiement Vercel

1. Pousser ce dépôt sur **GitHub (privé)**.
2. Importer dans Vercel → ajouter les variables d'environnement ci-dessus.
3. Le cron `vercel.json` appelle `/api/cron/reminders` toutes les 15 min
   (rappels d'activités à l'heure choisie + échéances projets à 9:00).
   Vercel envoie automatiquement `Authorization: Bearer $CRON_SECRET`.
4. Chaque push sur `main` déploie automatiquement.

## 5. Sécurité (rappels)

- `.env.local` est ignoré par Git — **jamais de clé dans le code**.
- Le RLS filtre chaque requête par `auth.uid()` sur toutes les tables.
- Un trigger PostgreSQL bloque la création d'un second compte.
- Export JSON mensuel recommandé (pas de PITR sur Supabase Free) :
  **Paramètres → Sauvegarde → Exporter**.

## 6. Structure

```
app/          Écrans (Accueil, Work, Progress, Citations, Paramètres) + API
components/   Composants UI (navigation, contrôles, formulaires, cartes)
lib/          Clients Supabase, chrono, stats, dates, export, push
public/       Service worker (sw.js), icônes PWA
supabase/     schema.sql + seed_quotes.sql
```
