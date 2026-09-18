# Partant

Marketplace locale de coachs sportifs — application React Native, backend Supabase de développement et prototype HTML de référence.


## Périmètre temporairement figé — 18 septembre 2026

La prochaine phase porte sur la stabilisation et la recette des parcours existants, puis les essais sur téléphone. Aucune nouvelle fonctionnalité ni refonte n’est prévue sans nouvelle décision. Voir [le périmètre figé et les critères de validation](docs/gel-mvp.md).

## Application cible et branchements

**Décision du 16 septembre 2026 : React Native + TypeScript + Expo, sans développement Swift préalable.** Le prototype HTML reste la référence visuelle validée. **Les prochaines modifications produit se font uniquement dans `apps/mobile`.** Le HTML est conservé comme archive de référence.

Consulter [la décision](docs/decisions/001-react-native.md) et [l’état exact des branchements et réglages à faire](docs/branchements.md). Les fondations Supabase sont déployées ; les étapes 1–3 restent en cours. Google est configuré côté serveur, avec consentements utilisateur à tester. Apple est activé côté serveur, avec premier consentement et échange réel à tester. Outlook reste reporté. Paiement et communications externes sont reportés.

La version native navigable reprend les actifs, les parcours client et les configurations coach du prototype. Voir [le suivi précis de parité](docs/parite-prototype-react-native.md) et [le lancement React Native](apps/mobile/README.md). Les parcours avancés et les lieux par plage sont désormais raccordés au serveur de développement : voir [la livraison 9](docs/connected-product-9.md). Les intégrations externes, paiements/communications et la validation sur appareils restent à traiter. Voir [la recette native](docs/recette-react-native.md).

## Dernière livraison — intégrations 10

[État exact, activation Google et limites](docs/integrations-10.md) : carte réelle, géocodage IGN, retours de connexion, écran d’agendas et synchronisation Google côté serveur. Les identifiants OAuth sont installés ; le consentement du propriétaire et les échanges réels restent à tester. Microsoft/Stripe reportés ; Apple activé, premier échange réel à tester. Les blocages Google et e-mail constatés lors de la recette sont documentés dans cette livraison.

## Ouvrir le prototype

Téléchargez le dépôt (bouton **Code → Download ZIP**), décompressez-le, puis ouvrez **[outputs/partant.html](outputs/partant.html)** dans votre navigateur. Aucun serveur ni installation nécessaire : CSS, JavaScript, photos et police sont intégrés au HTML.

Pour un aperçu local via HTTP, depuis la racine du dépôt :

```sh
python3 -m http.server 8765 --directory outputs
```

Ouvrez ensuite http://localhost:8765/partant.html.

## Ce que contient cette version

- Découverte de coachs, filtres, disponibilités, comparaison, favoris et profils.
- Entrées particulier/coach et onboarding adapté au sport, à l’objectif et au secteur en Île-de-France.
- Réservations individuelles, duo et groupes avec capacité configurable.
- Paiement simulé, confirmation, modification, annulation, export calendrier.
- Comptes fictifs distincts, conversations par séance, notifications, avis et réponses.
- Configuration coach : profil, offres, tarifs, lieux, planning, règles, consignes et activité.
- Réserver à nouveau, transfert de cours collectif et annulation partielle de places.
- Assistance et modération de démonstration.

Les priorités 1 et 2 sont incluses. La finalisation A1–A9 est disponible localement ; le suivi connecté a été actualisé dans [la livraison 9](docs/connected-product-9.md) : voir **[l’état des lieux MVP](outputs/MVP-etat-des-lieux.md)**. Voir [la finalisation du prototype](outputs/finalisation-prototype.md). Le point de sauvegarde GitHub antérieur est le commit 992eb4b.

## Tester les parcours

L’accueil propose des comptes de démonstration. Exemples : **alex@example.test**, **nina@example.test** côté particulier ; **thomas@example.test** côté coach. Code de démonstration : **123456**.

Les données d’essai restent dans le stockage local du navigateur. Utilisez un seul onglet pour tester les échanges entre comptes ; le fichier local et l’aperçu HTTP ont des stockages distincts.

Dans le prototype HTML autonome, le calendrier suit l’heure réelle de Paris et propose 90 jours de navigation, dans l’horizon configuré par le coach. Paiements, vérifications, versements, connexions et messages externes sont simulés. Aucun backend ni service de production n’est connecté.

## Organisation

```text
outputs/
  partant.html                 Prototype autonome à ouvrir
  LIRE-MOI.md                  Guide des parcours
  MVP-etat-des-lieux.md        Fonctionnalités présentes et reste à faire
  *.md                        Benchmark, réflexion produit et validation
  OFL-Hanken-Grotesk.txt       Licence de la police
work/
  partant.template.html       Source historique du prototype
  build.py                    Construction du HTML autonome
  coaches.png                 Visuels embarqués
  hanken*.ttf                 Police embarquée
  communes-idf.json            Données géographiques de travail
  test-*.cjs                  Tests actuels et historiques
  README.md                   Statut des scripts et sauvegardes historiques
```

Les fichiers historiques sont conservés pour sauvegarder le travail réalisé. Ils ne constituent pas des étapes à rejouer pour installer le prototype.

## Reconstruction historique du HTML

Python 3 suffit, sans dépendance externe :

```sh
python3 work/build.py
```

Cette commande historique écrit dans `outputs/partant.html`. Ne pas la lancer pour les nouvelles évolutions : la référence validée reste figée et le développement courant se fait dans `apps/mobile`.

## Vérifier

Node.js est nécessaire, sans installation de paquets :

```sh
node work/test-priority1.cjs
node work/test-notifications.cjs
node work/test-priority2.cjs
node work/test-regression-p1.cjs
node work/test-finalization.cjs
```

**478 vérifications réussies le 16 septembre 2026** : 337 existantes + 117 de finalisation + 24 dans jsdom. Ces suites vérifient la logique et le rendu dans un environnement DOM simulé ; elles ne constituent pas un audit complet d’accessibilité ou une validation de services réels.

## Documentation produit

- [Guide du prototype](outputs/LIRE-MOI.md)
- [État des lieux et périmètre MVP](outputs/MVP-etat-des-lieux.md)
- [Priorité 1](outputs/priorite-1.md)
- [Priorité 2](outputs/priorite-2.md)
- [Benchmark et conception](outputs/benchmark-et-conception.md)
- [Feuille de route produit](outputs/feuille-de-route-produit.md)
- [Vérification](outputs/verification.md)

Le dépôt Project-H-iOS a uniquement servi de référence visuelle en lecture seule ; il n’est pas modifié par ce projet.

Pour les tests DOM optionnels : `npm ci --prefix work/qa-runtime`, puis `node work/test-finalization-dom.cjs`. La revue visuelle mobile du prototype HTML a été validée par l’utilisateur le 16 septembre 2026 ; l’audit d’accessibilité reste à réaliser.
