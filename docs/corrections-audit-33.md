# Corrections de l’audit — livraison 33

État au 30 septembre 2026. Ce document complète l’[audit de la livraison 32](audit-app-webapp-2026-09-30.md), sans réécrire ses constats historiques. Application React Native et WebApp partagent ces corrections. Le prototype HTML est conservé.

## Corrections réalisées

| Constat | Correction | Preuve et limite |
| --- | --- | --- |
| Consignes privées dans la découverte | Projection publique par liste explicite de champs ; suppression des consignes dans les groupes également. Les participants conservent les informations de leur réservation. | 20 assertions locales et recette de l’API déployée. Les adresses publiques des lieux restent publiques intentionnellement. |
| Suppression partielle du compte | Effacement des profils, lieux, consignes, brouillons, notes et copies privées ; historique limité et anonymisé. File privée persistante, nettoyage Storage avant Auth, reprise avec bail et temporisation. Révocation des push/agendas et refus d’écriture avec un ancien JWT. | 48 assertions du worker ; 10 contrôles API/Storage sur comptes fictifs. Deux nettoyages serveur terminés, aucun en attente, aucun fichier orphelin à la fin. Aucun compte réel supprimé. |
| Session native dans AsyncStorage | Migration vers Expo SecureStore, écriture en deux emplacements et petits fragments Unicode, suppression de l’ancienne copie après sauvegarde sécurisée. Web inchangé. | 16 assertions de migration, interruption, taille et déconnexion. Recette Keychain sur iPhone après recompilation encore nécessaire. |
| Accessibilité commune | Favori séparé de la carte cliquable, groupe d’onglets déclaré, curseur HTML natif sur le web et valeurs accessibles en natif, fond de modale retiré du parcours Tab. | 20 états axe sans violation détectée ni débordement ; 35 contrôles clavier/focus et fenêtre de 720 CSS px. VoiceOver et zoom système réels restent à tester. |
| Disponibilités | Un seul état « Modifications non enregistrées », au niveau de la semaine. Les plages restent un brouillon jusqu’à l’accusé de sauvegarde habituel. | Parcours semaine/jour/plage et retours rejoués. Aucun changement des horaires imposé. |
| Lieux répétés | Déduplication des libellés de lieux dans la carte client. | Présentation uniquement, données des lieux conservées. |
| Recette vieillissante | Anciennes étapes remplacées par les parcours actuels ; attente de restauration du défilement par état ; recette reproductible et workflow GitHub Actions. | 41/41 suites locales/DOM ; 6/6 suites navigateur historiques, plus test clavier. La CI distante est à distinguer de cette exécution locale. |
| Dépendances | Six correctifs Expo, SecureStore, versions verrouillées et Podfile.lock actualisé. Node 24.19.0 documenté dans .nvmrc. | TypeScript, bundles web/iOS Hermes, tests du projet Xcode et alignement Expo passent. Doctor conserve seulement l’avis attendu de synchronisation manuelle du natif. |
| Exploitation | Contrôle agrégé des tâches et files ; sauvegarde métier vérifiée dans une table temporaire isolée. | Aucun échec cron sur 24 h au contrôle. La restauration vérifiée ne couvre pas Auth, Storage ou secrets ; ce n’est pas encore un exercice complet de reprise. |

La migration `20260930121503_privacy_cleanup_33.sql` et les fonctions `product-api`, `google-calendar`, `push-dispatch` ont été déployées sur le projet de développement autorisé. Les tables privées sans politique client restent intentionnellement réservées au serveur ; aucune politique permissive n’a été ajoutée pour faire disparaître un avis informatif.

Les anciennes références de suppression conservées dans les historiques ne sont pas une comptabilité complète ni une définition juridique définitive des durées de conservation. Les sauvegardes et les événements déjà exportés vers un agenda externe ne sont pas effacés instantanément.

## Compilation iPhone : point bloquant matériel

L’installation CocoaPods et la génération des modules ont réussi. Deux compilations simulateur ont échoué sur **No space left on device**, dont la seconde pendant la compilation de la cible Partant. Les dossiers DerivedData créés uniquement pour cet audit ont été retirés. Les sources et caches personnels des autres projets n’ont pas été supprimés.

Libérer plusieurs Go avant de relancer Xcode (viser au moins 10 Go de marge). Ouvrir `apps/mobile/ios/Partant.xcworkspace`, garder les réglages existants. La nouvelle dépendance SecureStore nécessite un nouveau build : une actualisation JavaScript seule ne suffit pas. Aucun build iPhone signé ni réception APNs n’est déclaré validé par cette livraison.

## Copie locale et Git

Le dossier Documents a renvoyé une erreur macOS « Need authenticator » lors de la comparaison de fichiers. Il n’a pas été écrasé sans comparaison. La copie corrigée et liée à Git est conservée hors iCloud dans `/Users/paulf/Developer/Partant-audit-33`. Utiliser son workspace Xcode pour cette livraison ; l’ancienne copie Documents n’est pas déclarée synchronisée. Les clés privées des anciens dossiers n’ont pas été déplacées ou ajoutées au dépôt.

## Points qui restent réellement ouverts

| Point | Prochaine action nécessaire |
| --- | --- |
| Compte équipe réel | Attendre l’adresse du compte administrateur explicitement désigné. Ne pas promouvoir le premier compte inscrit. Utiliser `configure-team-24.mjs`, puis traiter un dossier réel de test dans l’espace équipe. |
| Push et Google Calendar | Enregistrer un iPhone et connecter un agenda avec son consentement. À la fin de la recette : zéro appareil et zéro connexion enregistrés. Les tests simulés et crons réussis ne prouvent pas la réception. |
| Dernier parcours natif | Après espace disque et recompilation : Apple/Google succès, abandon et retour, Keychain/logout, clavier, retours, notifications et VoiceOver. Les validations antérieures du propriétaire restent acquises mais ne valident pas cette nouvelle version. |
| Confidentialité avant publication | Renseigner l’identité réelle du responsable, le contact, les durées par catégorie et la procédure opérateur. Aucun faux domaine/contact créé. La conformité juridique complète n’est pas annoncée. |
| E-mail à code et marque Partant | Expéditeur personnalisé/domaine toujours reportés ; le parcours affiche honnêtement le lien réellement envoyé, avec code optionnel si présent. Ne pas promettre un OTP français non activé. |
| Maintenance Postgres hébergé | Revue de compatibilité, sauvegarde complète et fenêtre de maintenance avant passage de 17.6 à la version proposée par Supabase. Aucune mise à niveau du moteur réalisée dans cette livraison. |
| Montée en charge | Mesurer une volumétrie représentative puis normaliser/paginer les domaines sollicités. Stockage JSON global et révision globale encore présents ; aucune capacité à grande échelle garantie. |
| Alertes et restauration complète | La commande de santé est disponible, mais aucun canal d’alerte externe ni planificateur d’exploitation supplémentaire n’est configuré. Tester la reprise Auth/fichiers/secrets sur environnement isolé avant ouverture. |
| Paiements / services reportés | Stripe Connect, SMTP/domaine, Outlook, SMS et push Android restent dans le périmètre reporté par le propriétaire. Aucun encaissement ni abonnement activé. |

## Reproduire la recette

Node 24.19.0 ; depuis la racine :

```sh
npm --prefix apps/mobile ci
npm --prefix tools/qa ci
npm --prefix services/calendar ci
npm --prefix apps/mobile run typecheck
node scripts/build-server-domain.cjs
cd apps/mobile
npx expo export --platform web --platform ios --output-dir dist --max-workers 1
cd ../..
node scripts/qa-33.cjs
```

Navigateur : installer Chromium avec `npx --prefix tools/qa playwright install chromium`, servir `apps/mobile/dist` sur 8098 et lancer `PARTANT_QA_URL=http://127.0.0.1:8098 node scripts/qa-33.cjs --browser`. Les interactions de recette attendent que les contrôles soient réellement activés avant de cliquer, pour respecter les transitions occupées sur les machines moins rapides. Le workflow `.github/workflows/qa.yml` enchaîne ces contrôles et archive les résultats. Il ne possède pas de secret serveur et ne déploie rien.

Pour un opérateur disposant déjà de l’accès CLI Supabase : `node scripts/check-operations-33.mjs`. La sortie ne contient que des compteurs ; exit 1 si une suppression ou un push reste bloqué, ou en cas d’échec cron/HTTP visible dans la rétention de pg_net. Un cron réussi peut simplement avoir mis sa requête HTTP en file ; les deux compteurs doivent être examinés. `node scripts/backup-product-23.mjs --verify` produit un fichier privé exclu de Git et vérifie sa reconstruction dans une table temporaire, sans remplacer les données vivantes.

Les scripts `test-connected-api.mjs` et `test-deletion-api-33.mjs` constituent une recette distante dédiée, avec fixtures isolées et nettoyage obligatoire ; ils ne font pas partie de la CI courante. Ne jamais les adapter pour supprimer un compte utilisateur réel.

Sources techniques : [SecureStore Expo](https://docs.expo.dev/versions/latest/sdk/securestore/), [suppression Auth Supabase](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser), [maintenance Postgres](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).
