# Partant — React Native

> Mise à jour du 18 septembre : carte et Google activés côté serveur ; consentements Google à tester et Apple à configurer. Voir [la livraison 10](../../docs/integrations-10.md).


> Livraison 9 : les lieux par plage et les parcours avancés sont disponibles en mode connecté (`?data=connected`). Voir [le périmètre et les limites](../../docs/connected-product-9.md). La démonstration locale reste accessible sans compte ; le HTML est archivé.

**Cette application est désormais la version de travail de Partant.** Le prototype HTML validé reste archivé comme référence. Voir [le suivi de parité](../../docs/parite-prototype-react-native.md) pour les parcours repris et les écarts restant à corriger.

## Lancer localement

Depuis `apps/mobile` :

```sh
npm ci
cp -n .env.example .env
# Renseigner uniquement la clé publique Supabase dans .env.
npm run web
```

Ne jamais utiliser une clé `service_role` ou une clé secrète dans `EXPO_PUBLIC_*`. Le fichier `.env` n’est pas versionné. Aucun déploiement public n’est nécessaire.

Le chemin `/` ouvre la démonstration native (code e-mail fictif `123456`). `/?data=connected` utilise les données de développement Supabase. `/?tools=connections` ouvre l’atelier technique antérieur. Sur iOS/Android, `EXPO_PUBLIC_DATA_MODE=preview` ou `connected` choisit le mode initial. Les parcours avancés (dossiers, transferts, remboursements, assistance…) sont locaux et restent à raccorder au backend.

Sur téléphone, `npm run ios` ou `npm run android` nécessite un simulateur/environnement adapté à Expo SDK 57. Les exports seuls ne sont pas des applications signées installables.

## Vérifier

Depuis la racine du projet :

```sh
npm --prefix apps/mobile run typecheck
node scripts/test-native-model.cjs
node scripts/test-native-complete.cjs
node scripts/test-native-availability.cjs
npm ci --prefix work/qa-runtime
```

Puis exporter le web depuis `apps/mobile` :

```sh
npx expo export --platform web
```

Et depuis la racine :

```sh
node scripts/test-native-web.cjs
node scripts/test-native-settings-web.cjs
node scripts/test-native-navigation-web.cjs
node scripts/test-native-availability-web.cjs
```

Les tests DOM utilisent des simulations des API de polices et de mise en page. Une revue visuelle réelle reste nécessaire.

`src/product/ui.tsx` centralise les composants et `tokens.ts` la DA. `src/product/model.ts` contient les règles de démo ; le mode connecté délègue les invariants à Supabase. `src/reference` contient les données extraites du prototype. Le fichier HTML source reste inchangé.

Les modules Expo ImagePicker, FileSystem et Sharing servent à importer un portrait et exporter ICS/CSV/JSON. Les documents de vérification et paiements restent fictifs. `workflows.ts` contient les opérations locales, `CoachConfiguration.tsx` les réglages et `CompleteFlows.tsx` les parcours avancés. Voir [la recette](../../docs/recette-react-native.md).
