# Partant

Marketplace locale de coachs sportifs — prototype mobile interactif, autonome et en français.


## Application cible et branchements

**Décision du 16 septembre 2026 : React Native + TypeScript + Expo, sans développement Swift préalable.** Le prototype HTML reste la référence visuelle validée. Le démarrage de l’application connectée se trouve dans `apps/mobile`.

Consulter [la décision](docs/decisions/001-react-native.md) et [l’état exact des branchements et réglages à faire](docs/branchements.md). Les fondations Supabase sont déployées ; les étapes 1–3 restent en cours. Google, Apple et Outlook ne sont pas encore activés. Paiement et communications externes sont reportés.

Le premier parcours natif navigable reprend maintenant les actifs et les écrans du prototype. Voir [le suivi précis de parité](docs/parite-prototype-react-native.md) et [le lancement React Native](apps/mobile/README.md). Le portage complet et sa validation visuelle restent en cours.

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

Les priorités 1 et 2 sont incluses. La finalisation A1–A9 est disponible localement ; le MVP connecté B1–B8 reste à réaliser : voir **[l’état des lieux MVP](outputs/MVP-etat-des-lieux.md)**. Voir [la finalisation du prototype](outputs/finalisation-prototype.md). Le point de sauvegarde GitHub antérieur est le commit 992eb4b.

## Tester les parcours

L’accueil propose des comptes de démonstration. Exemples : **alex@example.test**, **nina@example.test** côté particulier ; **thomas@example.test** côté coach. Code de démonstration : **123456**.

Les données d’essai restent dans le stockage local du navigateur. Utilisez un seul onglet pour tester les échanges entre comptes ; le fichier local et l’aperçu HTTP ont des stockages distincts.

Le calendrier suit l’heure réelle de Paris et propose 90 jours de navigation, dans l’horizon configuré par le coach. Paiements, vérifications, versements, connexions et messages externes sont simulés. Aucun backend ni service de production n’est connecté.

## Organisation

```text
outputs/
  partant.html                 Prototype autonome à ouvrir
  LIRE-MOI.md                  Guide des parcours
  MVP-etat-des-lieux.md        Fonctionnalités présentes et reste à faire
  *.md                        Benchmark, réflexion produit et validation
  OFL-Hanken-Grotesk.txt       Licence de la police
work/
  partant.template.html       Source actuelle faisant référence
  build.py                    Construction du HTML autonome
  coaches.png                 Visuels embarqués
  hanken*.ttf                 Police embarquée
  communes-idf.json            Données géographiques de travail
  test-*.cjs                  Tests actuels et historiques
  README.md                   Statut des scripts et sauvegardes historiques
```

Les fichiers historiques sont conservés pour sauvegarder le travail réalisé. Ils ne constituent pas des étapes à rejouer pour installer le prototype.

## Reconstruire

Python 3 suffit, sans dépendance externe :

```sh
python3 work/build.py
```

Le résultat est écrit dans `outputs/partant.html`. Modifiez `work/partant.template.html`, puis reconstruisez ; évitez de modifier uniquement le HTML généré.

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
