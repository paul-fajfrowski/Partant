# Partant — React Native

L’interface native reprend le prototype HTML validé. Voir [le suivi de parité](../../docs/parite-prototype-react-native.md) pour les parcours repris et les écarts restant à corriger.

## Lancer localement

Depuis `apps/mobile` :

```sh
npm ci
cp .env.example .env
# Renseigner uniquement la clé publique Supabase dans .env.
npm run web
```

Ne jamais utiliser une clé `service_role` ou une clé secrète dans `EXPO_PUBLIC_*`. Le fichier `.env` n’est pas versionné. Aucun déploiement public n’est nécessaire.

Le chemin `/` ouvre la démonstration native (code e-mail fictif `123456`). `/?data=connected` utilise les données de développement Supabase. `/?tools=connections` ouvre l’atelier technique antérieur. Les paramètres sont des modes de test web ; la navigation de production entre rôles reste à finaliser.

Sur téléphone, `npm run ios` ou `npm run android` nécessite un simulateur/environnement adapté à Expo SDK 57. Les exports seuls ne sont pas des applications signées installables.

## Vérifier

Depuis la racine du projet :

```sh
npm --prefix apps/mobile run typecheck
node scripts/test-native-model.cjs
npm ci --prefix work/qa-runtime
```

Puis exporter le web depuis `apps/mobile` :

```sh
npx expo export --platform web
```

Et depuis la racine :

```sh
node scripts/test-native-web.cjs
```

Les tests DOM utilisent des simulations des API de polices et de mise en page. Une revue visuelle réelle reste nécessaire.

`src/product/ui.tsx` centralise les composants et `tokens.ts` la DA. `src/product/model.ts` contient les règles de démo ; le mode connecté délègue les invariants à Supabase. `src/reference` contient les données extraites du prototype. Le fichier HTML source reste inchangé.
