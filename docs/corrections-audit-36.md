# Livraison 36 — fiabilité et préparation de la diffusion

4 octobre 2026. Suite à l’[audit global](audit-complet-2026-10-04.md), corrections dans la source partagée React Native/WebApp et sur le serveur de développement. Aucun compte réel transformé en compte équipe, aucun achat ni paiement activé. Le prototype HTML reste archivé.

## Défauts corrigés et limites

| Audit | Résultat | Vérification |
| --- | --- | --- |
| A36-01 — dépendances | Mitigations locales reproductibles de `braces` 3.0.3 et `node-forge` 1.4.0. Limite de profondeur avant parcours récursif et contrôle strict du nombre/paramètres des éléments DigestAlgorithm. | Motifs normaux, profondeur excessive, AST fourni directement, signature RSA valide, paramètres facultatifs valides et structures malformées. Installation échoue si la version/source change sans revue. |
| A36-02 — PostgreSQL | **Préparation effectuée, mise à jour non effectuée.** Précontrôle version/extensions/index/opérateurs ; sauvegarde métier privée et restauration en table temporaire dans une transaction annulée. | Serveur encore **17.6**. Aucun index ltree/GiST float concerné, opérateur applicatif à estimateur personnalisé ou fonction PGP applicative trouvé. Ce contrôle ne remplace pas une sauvegarde complète et une fenêtre de maintenance. |
| A36-03 — WebP | Bucket privé aligné sur PDF/JPEG/PNG/WebP. Taille 10 Mo et permissions inchangées. | Import/lecture propriétaire réels, refus lecture tierce/publique, HTML, fichier >10 Mo et écriture dans un autre compte. Fichiers QA supprimés. |
| A36-04 — changement d’heure | Les heures locales inexistantes et dates invalides renvoient un résultat invalide, jamais une heure décalée. Heure doublée d’automne : occurrence la plus tardive, comme auparavant. | Tests printemps/automne, jours de 23/25 h, minuit, maintien d’un départ valide à 03 h, refus serveur des départs inexistants sans écriture. |
| A36-05 — dialogue web | `aria-modal` n’est plus conservé sur le conteneur inactif de React Native Web quand son rôle disparaît. Correctif post-installation ESM et CommonJS. | Parcours offre → lieux → retour, axe et navigation clavier/fermeture dans les suites navigateur. VoiceOver réel reste à tester. |
| A36-06 — recettes | La recette desktop va chercher sa réservation dans la bonne semaine, y compris un dimanche. Le test des retours prépare explicitement une journée chargée. | 10/10 suites navigateur à la date réelle du dimanche 4 octobre, sans l’ancienne horloge de secours. |

Les plages habituelles restent décidées par le coach. Seuls les départs impossibles ou dont la durée réelle diverge de la durée locale au changement d’heure sont exclus. Les autres heures du jour restent proposées. Le diagnostic de disponibilité explique ce cas ; aucune réservation historique n’a été déplacée.

Les deux avis npm **restent signalés par npm**, car aucune version amont corrigée n’est publiée au contrôle. Les mitigations concernent les chemins Expo CLI/Metro recensés ; elles ne constituent pas un certificat de sécurité global. Ne pas rétrograder Expo via `npm audit fix --force`. Le contrôle CI signale les deux avis connus avec la mention « mitigated », exécute les régressions correspondantes et échoue pour tout nouvel avis non revu. Remplacer ces patchs par les versions amont corrigées dès qu’elles sont compatibles, avec nouvelle recette.

Sources : [avis braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [avis node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [maintenance PostgreSQL annoncée par Supabase](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).

## Améliorations supplémentaires

- **Photos** : une photo de profil connectée peut atteindre les 5 Mo autorisés côté serveur. Le mode connecté ne charge plus inutilement sa copie base64 ; la restriction de 600 Ko reste uniquement celle de l’aperçu local. Pas encore de redimensionnement automatique des grandes photos ni de prise en charge HEIC garantie.
- **Production** : `EXPO_PUBLIC_RELEASE_CHANNEL=production` force le mode connecté et ignore les paramètres de démonstration/outillage. L’export public dédié retire les lanceurs simulation/recette. Les essais locaux gardent ces outils.
- **Cache de compilation** : séparation par empreinte des variables publiques. Le test de l’export a effectivement détecté un cache réutilisant le mode précédent ; corrigé avec `metro.config.js`, sans supprimer les caches Xcode/CocoaPods. [Fonctionnement du cache Metro](https://metrobundler.dev/docs/configuration/#cacheversion).
- **Xcode** : configuration Release connectée avec garde de production. Un build QA volontaire peut redéfinir le canal dans `.xcode.env.local`, non versionné. Aucun chemin personnel ajouté aux fichiers partagés.
- **Manifeste de confidentialité iOS** : catégories des données utilisées renseignées dans `app.json` et `PrivacyInfo.xcprivacy`, avec fonctionnalité de l’app comme finalité, association au compte et absence de suivi publicitaire. Motifs des API système conservés. Cette déclaration technique ne complète pas à elle seule la notice légale ni App Store Connect. [Documentation Apple](https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests).
- **CI** : refuse un domaine serveur généré périmé ; contrôle les secrets dans les fichiers suivis ; examine les dépendances ; teste l’export public contre les URL de démo et un compte fictif déjà présent dans le navigateur. Le scan de secrets reste ciblé sur les fichiers suivis, pas un audit exhaustif de l’historique Git.
- **Hébergement** : modèle `_headers` fourni avec l’export public : anti-sniffing, politique de référent, restriction d’encadrement/objets, permissions et cache des ressources à nom haché. Syntaxe Netlify/Cloudflare Pages ; à appliquer explicitement avec tout autre hébergeur. Aucun hébergement publié. La CSP reste une base, pas une politique stricte complète de tous les scripts/connexions.
- **Exploitation** : le contrôle de santé détecte aussi une tâche planifiée absente, désactivée ou qui ne réussit plus, même si elle ne produit aucune nouvelle erreur. Tolérances 15 min pour Calendar, 5 min pour push et 90 min pour entretien. Pas d’alerte externe envoyée sans destinataire/service configuré.

## Tests et livrables

- TypeScript : réussi ; manifeste natif valide (`plutil`).
- **44/44 suites métier et DOM**, incluant 43 nouvelles assertions de durcissement.
- **10/10 suites navigateur** sur l’export partagé ; test additionnel de l’export public réussi.
- **67 contrôles serveur** : 36 API/Auth/concurrence/confidentialité, 20 fonctionnalités, 7 Storage et 4 changement d’heure.
- Comptes et objets QA : **zéro restant**, confirmé après nettoyage ciblé.
- Export web et bundle Hermes iOS construits. Export iOS connecté de production construit séparément ; il ne constitue pas un build Xcode signé ni une recette physique.
- Fonctions de développement actives : `product-api` v24, `google-calendar` v19, `push-dispatch` v12. Migration Storage `20261004163226_storage_webp_36` appliquée.

[Preuves de recette](audits/2026-10-04-corrections/). Un premier lancement local a démarré certaines suites DOM pendant la reconstruction de leur export ; trois lectures de fichier ont alors échoué. Le passage complet suivant, après export terminé, est celui conservé ici (44/44). Le contrôle initial de l’export public a également échoué avant la correction du cache, puis réussi après celle-ci.

## Reproduire

Depuis la racine du dépôt, Node 24 et dépendances installées :

```sh
npm --prefix apps/mobile ci
npm --prefix tools/qa ci
npm --prefix services/calendar ci
npm --prefix apps/mobile run typecheck
node scripts/check-dependencies-36.cjs
node scripts/check-secrets-36.cjs
node scripts/build-server-domain.cjs
# Construire l’export mobile web/iOS avant les suites DOM.
# Voir .github/workflows/qa.yml pour l’enchaînement exact et les tests navigateur.
node scripts/qa-33.cjs
npm --prefix apps/web run build:production
```

`build:production` génère `apps/web/dist-production`, distinct de `apps/web/dist` et `apps/mobile/dist`. Cela désactive les outils de démo, **sans créer un environnement Supabase de production ni activer le paiement**. Le test `scripts/test-release-36.cjs` attend cet export servi sur le port 8099 (ou `PARTANT_RELEASE_URL`). Les tests API/Storage utilisent uniquement les comptes éphémères `partant-qa-…@example.invalid` et nécessitent leur préparation/nettoyage.

## Travail restant, non présenté comme terminé

**Informations ou services du propriétaire** : opérateur équipe désigné, identité/contact et règles de conservation, domaine/boîte professionnelle/SMTP, décisions paiement/visio et compte fournisseur. Aucun de ces points n’est inventé.

**Chantiers techniques encore ouverts** : maintenance PostgreSQL effective, MFA et séparation des habilitations équipe, normalisation/pagination serveur et charge représentative, sauvegarde complète Auth/Storage/configuration avec restauration isolée et copie hors machine, alertes opérateur, routes web partageables et retour navigateur, redimensionnement des photos. Ils demandent un chantier et une validation propres ; cette livraison n’affirme pas avoir terminé tout l’audit.

**Recette nécessitant un appareil/compte réel** : dernier build iPhone signé, VoiceOver/Dynamic Type, parcours à deux appareils, réception APNs et consentement/synchronisation Google Calendar. Les compteurs Calendar/appareils push/équipe étaient encore à zéro après nettoyage au contrôle du 4 octobre. Les simulations ne remplacent pas ces preuves.
