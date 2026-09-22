# Partant

**WebApp — livraison 27 :** [parcours ordinateur, architecture partagée et recette](docs/webapp-27.md). [Construire et ouvrir la WebApp localement](apps/web/README.md).

**Documents & vérifications — livraison 26 :** [dossier par pratique, justificatifs réutilisables et décisions équipe](docs/documents-verifications-26.md).

**Livraison 24 — ergonomie coach et client :** [changements, validation des dossiers et recette](docs/coach-experience-24.md).


## Backend et notifications push iPhone — livraison 23

[Configuration, corrections et recette](docs/backend-push-23.md). Lectures conditionnelles, maintenance planifiée, file privée de push et préférences par compte. APNs Sandbox configuré ; nouveau build et réception sur iPhone encore à vérifier. Aucun nouveau service payant.

## Audit des dépendances — livraison 22

[Corrections, contrôles et limites de compilation](docs/dependency-audit-22.md). Versions Expo alignées, module natif dédupliqué, audit npm sans vulnérabilité connue et correctif C++ reproductible. Le nouveau build iPhone reste à valider dans Xcode ; les warnings fournisseurs ne sont pas masqués.

## Connexion par e-mail — livraison 21

[Parcours corrigé et analyse Xcode](docs/email-auth-21.md). L’application annonce le lien réellement envoyé ; le code reste facultatif. La personnalisation des e-mails attend le branchement SMTP reporté. Les retours de navigation sont validés par le propriétaire sur iPhone.

## Retours et sorties de parcours — livraison 20

[Corrections et recette de navigation](docs/navigation-20.md). Retour et fermeture vers le bon espace, inscription quittable, retour e-mail sans perte de séance, confirmation sans retour au paiement. Apple natif iPhone confirmé fonctionnel par le propriétaire.

## Connexion iPhone et espaces — livraison 19

[Changements, configuration Xcode et recette restante](docs/native-auth-19.md). Apple natif iOS, séparation client/coach, découverte sans faux profil invité et reprise après connexion. Le workspace iOS est versionné. Domaine Google personnalisé et cas secondaires natifs restent à vérifier ; Apple sur iPhone est validé par le propriétaire. Aucun paiement réel.

> **Validation utilisateur — 18 septembre 2026 :** le propriétaire confirme que les connexions Apple et Google fonctionnent dans la simulation web ; son compte Google a été ajouté aux utilisateurs de test. Le blocage Google est levé pour ce compte. Cette validation ne couvre pas encore Google Calendar, les appareils natifs ni tous les cas secondaires d’authentification.

Marketplace locale de coachs sportifs — application React Native, backend Supabase de développement et prototype HTML de référence.


## Périmètre temporairement figé — 18 septembre 2026

La prochaine phase porte sur la stabilisation et la recette des parcours existants, puis les essais sur téléphone. Aucune nouvelle fonctionnalité ni refonte n’est prévue sans nouvelle décision. Voir [le périmètre figé et les critères de validation](docs/gel-mvp.md).

## Application cible et branchements

**Décision du 16 septembre 2026 : React Native + TypeScript + Expo, sans développement Swift préalable.** Le prototype HTML reste la référence visuelle validée. **Les prochaines modifications produit se font uniquement dans `apps/mobile`.** Le HTML est conservé comme archive de référence.

Consulter [la décision](docs/decisions/001-react-native.md) et [l’état exact des branchements et réglages à faire](docs/branchements.md). Les fondations Supabase sont déployées ; les étapes 1–3 restent en cours. Google et Apple web sont validés par le propriétaire ; le consentement Google Calendar et les essais sur appareils restent à faire. Outlook reste reporté. Paiement et communications externes sont reportés.

La version native navigable reprend les actifs, les parcours client et les configurations coach du prototype. Voir [le suivi précis de parité](docs/parite-prototype-react-native.md) et [le lancement React Native](apps/mobile/README.md). Les parcours avancés et les lieux par plage sont désormais raccordés au serveur de développement : voir [la livraison 9](docs/connected-product-9.md). Les intégrations externes, paiements/communications et la validation sur appareils restent à traiter. Voir [la recette native](docs/recette-react-native.md).

## Messagerie — conversations par personne

[Présentation simplifiée et recette actuelle](docs/communication-15.md) : une conversation privée par personne, sans choix de séance avant l’envoi, avec accès facultatif aux réservations, recherche, chronologie, brouillons et reprise sans doublon après une coupure réseau. Les mécanismes de fiabilité sont décrits dans [la livraison 14](docs/messaging-14.md). Disponible en démo et connecté ; les brouillons restent propres à chaque appareil.

## Notifications — amélioration autorisée après le gel

[Historique progressif et accès aux actions en attente](docs/notifications-paging-17.md) : 10 événements au départ, chargement par 10, liste et position conservées au retour d’un détail.

[Messages retirés des notifications et de leur compteur](docs/notifications-without-messages-16.md) : les échanges et leur badge restent uniquement dans la messagerie.

[Rubriques par type, historique dans chaque rubrique et résultats de recette](docs/communication-15.md). Les états métier et accès directs de [la livraison 13](docs/notifications-13.md) sont conservés. Disponible en démo locale et sur le serveur de développement. La lecture reste distincte de la résolution ; les anciens événements sans date restent identifiés comme tels.

## Dernière livraison — intégrations 10

[État exact, activation Google et limites](docs/integrations-10.md) : carte réelle, géocodage IGN, retours de connexion, écran d’agendas et synchronisation Google côté serveur. Les identifiants OAuth sont installés ; les connexions Google/Apple web sont validées par le propriétaire. Le consentement et les échanges Google Calendar réels restent à tester. Microsoft/Stripe sont reportés. Les blocages Google et e-mail constatés lors de la recette sont documentés dans cette livraison.

## Recette et simulation mobile

[Simulation de volume coach](docs/simulation-volume-coach.md) : 144 séances, 36 clients et 446 notifications fictives pour évaluer les rubriques actuelles. [Lancer le parcours visible](http://127.0.0.1:8081/coach-volume.html?autoplay=1). Les messages sont désormais retirés des notifications générales : [état actuel et suite proposée](docs/notifications-without-messages-16.md). La [limitation des listes et l’accès aux actions sont maintenant implémentés](docs/notifications-paging-17.md).

[Résultats de la recette du 18 septembre et limites](docs/recette-2026-09-18.md). Après l’export web, le serveur local propose une [recette visible automatique](http://127.0.0.1:8081/recette.html?autoplay=1) et un [aperçu téléphone interactif](http://127.0.0.1:8081/simulation.html). Le déroulé visible utilise la démo isolée ; les essais Supabase sont effectués séparément.

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

### Confidentialité — livraison 25

Information à l’inscription et espace Confidentialité client/coach : voir [le périmètre, les contrôles et les points à finaliser avant ouverture publique](docs/confidentialite-25.md). Aucun consentement global ou marketing ajouté.

### Documents & vérifications — livraison 26

Dossier commun, pièces adaptées aux pratiques/statuts, réutilisation des documents et validation distincte de chaque pratique. Le dossier reste au début du parcours coach. Voir [le fonctionnement, la recette et les limites](docs/documents-verifications-26.md). Simulation : http://127.0.0.1:8081/simulation.html?mode=connected&version=documents-26 . Refaire le build Xcode pour charger les nouveaux écrans ; pas de changement de dépendances natives.
