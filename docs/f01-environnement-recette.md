# F01 Préparation de l environnement et de la recette

13 octobre 2026. Branche locale : `feature/01-environnement-recette`. Sources produit testées : `38ac3bd`, livraison 38. La préparation locale et les lectures publiques du serveur réel sont réalisées ; F01 reste ouverte jusqu'à l'installation d'un build signé sur iPhone. Les connexions utilisateur relèvent de F02.

## Changements pour Wilson

La copie Git utilisée est `/Users/wilsonlim/Desktop/Partant/Partant`. Le dossier parent contient une autre copie de fichiers et certaines dépendances ; ses installations n'ont pas été réutilisées. Les futurs essais doivent partir de la copie Git.

Les dépendances mobile, QA, Calendar et CocoaPods sont installées avec les versions verrouillées. Le postinstall applique les correctifs natifs et web de Paul. Node 24.19.0 était déjà disponible via nvm et a été utilisé pour les installations, exports et tests. Xcode utilise ce Node grâce à `.xcode.env.local`, ignoré par Git ; le Node Homebrew global n'a pas été changé.

La WebApp s'ouvre sur [l'aperçu connecté local](http://127.0.0.1:8081/?data=connected&surface=web). Le serveur est limité à ce Mac. L'export a été reconstruit avec la vraie configuration publique après la recette isolée ; l'accueil et « Explorer sans compte » sont vérifiés dans un navigateur QA neuf, avec les réponses HTTP 200 d'Auth et de `product-api`. La [démo](http://127.0.0.1:8081/?data=preview&surface=web) reste accessible explicitement. Aucun de ces aperçus web n'est une application native installée.

`apps/mobile/.env` a été créé à partir de `.env.example` avec accès au fichier limité au propriétaire. L'URL du projet de développement, le mode connecté et une clé publique active sont désormais renseignés. La fausse clé QA n'a pas été enregistrée dans ce fichier. Aucune valeur de clé n'est copiée dans ce bilan ou dans Git.

## Résultats exécutés

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| Installation npm et postinstall | Réussite | Versions des lockfiles conservées, correctifs de Paul appliqués |
| Installation CocoaPods | Réussite | Dépendances du workspace existant installées |
| TypeScript | Réussite | `npm --prefix apps/mobile run typecheck` |
| Métier et DOM | 47 suites sur 47 réussies | Fixtures locales, pas de transactions Supabase réelles |
| Navigateur | 12 suites sur 12 réussies | Chromium local sur les scénarios de recette |
| UI et accessibilité navigateur | 20 états, aucun débordement, violation axe ou erreur détectés | Ne valide pas VoiceOver ni les gestes natifs |
| Calendar | 12 tests sur 12 réussis | Réponses fournisseurs simulées, pas de consentement réel |
| Domaine serveur généré | Aucun écart avec Git | Aucun changement de règle ni déploiement serveur |
| Contrôle des secrets | Réussite | Contrôle existant du dépôt |
| Exports web et iOS Hermes | Réussite | Configuration QA fictive ; Hermes seul n'est pas un build signé |
| Construction WebApp développement et production | Réussite | Exports locaux, sans hébergement ni publication |
| Isolation de l'export production | Réussite | Paramètres et compte fictif de démo ignorés ; pages de recette retirées |
| Lectures Supabase réelles | HTTP 200 pour Auth settings et `product-api` | Lecture publique avec la vraie clé ; fournisseurs Google et Apple activés, connexions utilisateur non testées |
| Construction WebApp connectée et ouverture navigateur | Réussite | Accueil connecté, aucun défaut de configuration ou erreur JavaScript dans le contrôle exécuté |
| Compilation Xcode Release sans signature | `BUILD SUCCEEDED` | Code natif compilé, avec configuration QA fictive ; non installable sur iPhone |
| Compilation Xcode Release signée | Échec | Profil de provisioning manquant pour le bundle Partant |
| Contrôle des dépendances | Échec | Deux nouveaux avis hors des mitigations documentées |

Les logs sont conservés localement dans `work/f01/` et les résultats détaillés dans `work/qa-results/`, tous deux ignorés par Git. Le rapport historique de volume coach a été conservé ; le nouvel essai n'en remplace pas la date.

## Configuration Supabase résolue

L'accès initial du connecteur Supabase était refusé. Après l'intervention de Wilson, le connecteur peut lire les clés publiques du projet `jhhsysjdeyqsuztjtgea` et la clé publique a été renseignée dans `.env`. Auth settings et la lecture publique `product-api` répondent HTTP 200 avec cette configuration. Aucune clé secrète ni `service_role` n'a été utilisée dans le frontend.

L'export WebApp a été reconstruit et son accueil connecté vérifié. Les scénarios Apple/Google/e-mail avec compte réel restent à exécuter dans F02 ; l'activation des fournisseurs ne vaut pas connexion validée.

## Blocages Apple et dépendances

### Signature et appareil Apple

Xcode 27.0 et CocoaPods 1.17.0 sont disponibles ; le disque avait environ 284 Go libres au contrôle. Le service CoreDevice répond hors du sandbox mais ne voit que deux simulateurs arrêtés, aucun iPhone physique. Aucun certificat de signature valide n'a été trouvé dans le trousseau.

La compilation signée échoue avec « No profiles for 'com.paulfajfrowski.partant' were found ». Il faut un compte Xcode autorisé dans l'équipe Apple de Paul, le certificat/profil adapté et un iPhone branché, appairé et en mode développeur. Le Bundle ID, l'équipe, les capacités et les réglages versionnés n'ont pas été modifiés pour contourner ce blocage.

La vérification sans signature emploie seulement `CODE_SIGNING_ALLOWED=NO` dans la commande locale. Le projet conserve ses réglages de signature.

### Avis de dépendances corrigés dans F01 bis

Au contrôle initial F01, le garde-fou existant `scripts/check-dependencies-36.cjs` refusait deux avis supplémentaires :

- `shell-quote` 1.10.0 : avis critique [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), version corrigée annoncée 1.11.0. Le paquet est notamment installé via les outils React Native.
- `source-map-js` 1.2.1 : avis élevé [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), version corrigée annoncée 1.2.2. Il est présent dans l'app et les outils QA.

Le [correctif F01 bis](f01bis-dependances.md) met à jour les deux paquets et fait à nouveau passer le contrôle, avec 48 suites métier/DOM et 12 suites navigateur réussies. Le tableau ci-dessus conserve l'état initial F01. Les deux anciens avis de la livraison 36 restent signalés en amont avec leurs mitigations locales vérifiées ; aucune exception ni mise à jour forcée n'a été appliquée.

## Reprendre sur ce Mac

Depuis un terminal :

```sh
cd /Users/wilsonlim/Desktop/Partant/Partant
source "$HOME/.nvm/nvm.sh"
nvm use
```

Pour servir à nouveau la WebApp connectée déjà construite, lorsque le port 8081 est libre :

```sh
python3 -m http.server 8081 --bind 127.0.0.1 --directory apps/web/dist
```

Ouvrir `http://127.0.0.1:8081/?data=connected&surface=web`, ou `?data=preview&surface=web` pour la démo. Ce serveur sert un export figé : les futures modifications nécessitent une nouvelle construction.

Pour développer avec rechargement des modifications, arrêter le serveur statique avec Ctrl+C puis lancer :

```sh
npm --prefix apps/web run dev
```

Pour Xcode, ouvrir le lanceur de cette copie, `Ouvrir Partant.command`. Les Pods sont désormais présents ; vérifier le compte et la signature avant un nouvel essai sur appareil. La compilation signée doit être refaite avec la vraie configuration publique après résolution des prérequis.

## État Git et limite de livraison

Les installations, exports, caches, `.env` et `.xcode.env.local` restent locaux et ignorés. Aucun service distant, achat, paiement ou publication n'a été activé.

CocoaPods a recalculé un seul checksum dans `Podfile.lock`, celui d'ExpoModulesCore, sans changer de version. Le podspec généré inclut le chemin absolu de cette copie : remplacer ce chemin par celui documenté de Paul reproduit exactement l'ancien checksum. Cette différence est locale et ne constitue pas une mise à jour de dépendance. Le réordonnancement du manifeste de confidentialité généré par CocoaPods était sémantiquement identique ; l'ordre versionné a été conservé.

Le plan et ce bilan sont les documents à revoir pour F01. Le build iPhone avec la vraie configuration publique, sa signature et son installation physique restent à fournir avant de fermer la feature ; F02 n'a pas été commencé.

Au passage de relais, trois fichiers iOS ont encore des différences locales : `Partant.xcodeproj/project.pbxproj` contient une autre équipe de signature choisie dans Xcode, `Partant/Info.plist` conserve les mêmes valeurs avec un ordre de clés différent, et `Podfile.lock` porte le checksum local décrit ci-dessus. Ces changements restent hors du commit partagé. Les préserver et les examiner avant toute compilation ; l'équipe Apple de référence reste `4STLA425HP`, sans prétendre que l'accès de Wilson est déjà disponible. Paul a indiqué préparer cet accès à son retour le soir du 13 octobre.
