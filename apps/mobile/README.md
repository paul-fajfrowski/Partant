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

Le chemin `/` suit `EXPO_PUBLIC_DATA_MODE` (connecté dans la configuration locale actuelle). `/?data=preview` ouvre la démonstration avec données fictives et `/?data=connected` utilise le serveur de développement. `/?tools=connections` ouvre l’atelier technique antérieur. Les deux modes utilisent les mêmes écrans et règles partagées ; les écritures serveur ne sont effectuées qu’en mode connecté. Consulter `docs/corrections-audit-33.md` pour les intégrations réellement validées et restantes.

Pour Xcode, double-cliquer sur `Ouvrir Partant.command` à la racine du dépôt. Le schéma partagé `Partant` utilise Release pour embarquer le JavaScript sans dépendre de Metro. `.xcode.env` fixe le mode connecté lors de la compilation. Pour une compilation native de démonstration explicite, ajouter temporairement `export EXPO_PUBLIC_DATA_MODE=preview` à `.xcode.env.local`, puis recompiler ; retirer cette ligne pour revenir au connecté. Un changement de mode nécessite de reconstruire le bundle, pas seulement de changer une variable dans les arguments de lancement du schéma. Cette variante QA utilise le même identifiant d’application et remplace donc l’installation précédente sur l’iPhone.

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

## Mise à jour iPhone — 20 septembre

Voir [la livraison 19](../../docs/native-auth-19.md). Le workspace `ios/Partant.xcworkspace` est désormais versionné. Après `npm ci`, exécuter `pod install` dans `ios`. Ne pas régénérer iOS avec `--clean` pour rouvrir le projet. Apple utilise un module natif ; reconstruire depuis Xcode après cette mise à jour. Le `.env` local choisit `EXPO_PUBLIC_DATA_MODE=connected`, les simulations fictives utilisent explicitement `?data=preview`.
