# Partant WebApp

La WebApp utilise le même code React Native Web que l’application iPhone (`../mobile`), le même projet Supabase et les mêmes commandes serveur. Aucun second catalogue ni second système de connexion.

## Développement

Depuis la racine du dépôt :

```sh
npm --prefix apps/mobile ci
npm --prefix apps/web run dev
```

Le navigateur affiche un espace ordinateur dès 1 080 px. Sous ce seuil, la navigation mobile adaptée prend le relais. Les simulations en iframe de largeur téléphone restent mobiles.

## Construire sans publier

```sh
npm --prefix apps/web run build
npm --prefix apps/web run preview
```

Ouvrir `http://127.0.0.1:8081/web.html` pour les données connectées, ou `http://127.0.0.1:8081/web.html?data=preview` pour une démonstration fictive. Le port 8081 doit être libre : arrêter le précédent serveur local avant de démarrer un autre aperçu. Le serveur de prévisualisation reste accessible uniquement sur le Mac.

`apps/web/dist` est un export statique local ignoré par Git. Le lanceur `web.html` ouvre l’application elle-même, pas un cadre téléphone ni une iframe.

## Configuration

Les variables publiques restent dans `apps/mobile/.env` (non versionné). Utiliser `.env.example` comme référence. Les secrets Apple, Google, APNs et le service Supabase ne doivent jamais entrer dans cet export.

Le mode connecté utilise les comptes et données du projet de développement existant. L’authentification web conserve les callbacks autorisés existants sur le port 8081. Un autre domaine ou port devra être autorisé dans Supabase avant une recette OAuth ; ne pas inventer de domaine.

Les derniers états serveur sont rechargés périodiquement lorsque l’application est visible. Le web et le téléphone synchronisent les données enregistrées, pas les brouillons locaux ni la position de navigation. L’autorisation d’accès à l’espace équipe provient exclusivement du serveur.

Le paiement reste simulé ; cette WebApp ne réactive aucun des branchements reportés. Les push actuellement configurés concernent iOS, pas les notifications du navigateur. L’usage hors connexion et la publication publique ne sont pas inclus.

Voir `../../docs/webapp-27.md` pour la recette et les limites.
