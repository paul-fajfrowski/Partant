# Audit de Partant App et WebApp

**30 septembre 2026 · application, parcours web, serveur de développement et préparation du MVP.**

Partant possède un socle fonctionnel avancé et une interface cohérente entre téléphone et ordinateur. Les principaux parcours automatisés passent. **La suite doit porter sur la fiabilisation et l’exploitation des fonctionnalités existantes : une ouverture commerciale n’est pas encore validée.** Cet audit identifie notamment deux défauts de traitement des données, des problèmes d’accessibilité web et des intégrations dont le fonctionnement réel reste à démontrer.

Ce document sert à Paul et à son collègue pour décider des prochaines corrections. Il distingue les anomalies reproduites, les travaux volontairement reportés et les vérifications encore absentes. Aucune correction fonctionnelle, migration, habilitation ou modification de compte réel n’a été effectuée pendant l’audit.

## Périmètre et méthode

- Révision Git examinée : `2a88fa17f6635d01d0827bf37f87e2fe319df194`, code produit de la livraison 32. Comparaison avec le dossier local utilisé par Xcode : aucun écart dans les sources versionnées ; seul un ancien résultat de test JSON diffère.
- Réinstallation des dépendances, compilation TypeScript, export web et bundle iOS Hermes, audit npm et Expo Doctor.
- Tests de règles métier, tests DOM avec fournisseurs simulés, six suites Chromium et contrôle complémentaire de 20 états aux largeurs **320, 390, 820 et 1440 px**. Inspection des captures client, coach et édition des disponibilités.
- Lecture du code partagé, des migrations et des fonctions serveur. Contrôles en lecture seule des droits, politiques de stockage, tâches planifiées et compteurs du projet Supabase de développement. Dix sondes HTTP sans authentification ni opération métier réussie.
- Les essais navigateur utilisent un export isolé sur le port 8098. Le serveur 8081 affiché dans les anciennes simulations ne répondait pas au début de l’audit. Les captures et scénarios métier emploient des données fictives locales.

**Limites :** aucune connexion personnelle Apple/Google réalisée pendant l’audit, aucun e-mail ou push envoyé, aucune réservation réelle injectée, aucun test bancaire. Le rendu mobile dans Chromium ne vaut pas une recette native sur iPhone. Safari, Firefox, Android, VoiceOver, clavier iOS, perte réseau sur appareil, restauration de sauvegarde et charge serveur restent à tester. Les validations antérieures du propriétaire ne sont pas présentées comme de nouveaux résultats.

## Résultats des contrôles

| Contrôle | Résultat du jour | Portée |
| --- | --- | --- |
| TypeScript | Réussi | Cohérence statique des sources |
| Export web et iOS Hermes | Réussi | Construction des bundles ; pas une validation de signature ou d’installation iPhone |
| Compilation Xcode pour simulateur | Non conclue dans la limite de 6 minutes | Le workspace se lit ; la compilation atteint les scripts de dépendances/ReactCodegen sans terminer |
| Suites de règles et DOM | 42 scénarios de suite réussis sur 48 lancés | 5 attendent une ancienne interface ; 1 nécessite un fichier ReactCodegen absent du clone sans installation des Pods |
| Suites Chromium actuelles | 6 réussies, **298 contrôles** | WebApp 45, dossier 16, fiche de plage 20, densité agenda 39, éditeur 78, retours 100 |
| Complément responsive | 20 états inspectés | Aucun débordement horizontal global ni exception JavaScript capturée ; des violations d’accessibilité restent présentes |
| Protection HTTP anonyme | 10 réponses conformes | Catalogue accessible ; écritures et accès privés refusés ; méthode et corps invalides rejetés |
| Dépendances npm de l’app | 0 vulnérabilité connue remontée | Ce résultat ne couvre ni tout le code natif ni les erreurs métier |
| Expo Doctor | 19 vérifications sur 21 réussies | Correctifs de dépendances disponibles et configuration native versionnée à maintenir |
| Domaine serveur généré | Identique au fichier versionné après génération | Pas de décalage observé entre règles TypeScript et artefact serveur du dépôt |

Un échec de pagination des notifications lors de l’exécution parallèle disparaît à la répétition isolée du même test, sans modification de l’application : le test repose sur des attentes temporelles fragiles. Les premières erreurs liées à la configuration publique et au cache d’export ont été résolues dans l’environnement de recette et ne sont pas comptées comme des bugs produit.

Les résultats ne constituent pas un « pourcentage d’application terminée ». Les tests existants passent sur leurs assertions et peuvent manquer un défaut : les deux reproductions de confidentialité ci-dessous le montrent.

**Vérification native :** `xcodebuild -list` a finalement réussi à lire le workspace local après plusieurs minutes. Le contrôle des dépendances dans ce dossier a dépassé deux fois la limite de 90 secondes, alors que le clone isolé atteint le fichier ReactCodegen manquant. Aucun cache Xcode ni dossier iOS n’a été supprimé. La lecture du workspace ne prouve ni une compilation complète ni un fonctionnement sur appareil.

Une compilation Debug pour simulateur, sans signature et avec un nouveau dossier de produits de build, a ensuite été tentée. Elle a atteint les scripts des dépendances puis ReactCodegen, mais n’a pas terminé dans les six minutes imparties ; les seuls processus de ce build d’audit ont été arrêtés. Aucun diagnostic `error:` n’était apparu dans le journal collecté. **C’est une validation native non conclue, pas la preuve d’un build réussi ni d’un bug de compilation identifié.** [Résultat natif](audits/2026-09-30/native-build.json).

Preuves : [tests métier et DOM](audits/2026-09-30/tests.json), [tests Chromium](audits/2026-09-30/browser-tests.json), [responsive et accessibilité](audits/2026-09-30/ui-audit.json), [sondes HTTP](audits/2026-09-30/http.json), [constats serveur](audits/2026-09-30/server-summary.json), [environnement de recette](audits/2026-09-30/environment.json).

## Corrections prioritaires

P1 signifie à traiter avant de confier des données et des parcours réels à des testeurs externes. P2 désigne une correction importante de qualité ou de préparation de la distribution. Un service non encore testé n’est pas déclaré en panne.

### P1 Consignes privées possibles dans la découverte publique

**Anomalie reproduite en mémoire.** La projection du catalogue reprend presque tous les réglages d’un coach publié avec `...cfg`. Elle retire les notes clients, les informations professionnelles et les documents, mais conserve `preparation.meeting` ainsi que `locations[*].instructions`.

Un coach pourrait y inscrire un code d’entrée, une consigne réservée aux participants ou un lien de visioconférence. Ces champs se retrouvent dans la réponse destinée à un visiteur anonyme, même si l’écran ne les affiche pas. La reproduction utilise deux marqueurs fictifs ; **aucune fuite de donnée réelle n’a été recherchée ni constatée**.

Références : [`connectedDomain.ts`, fonction `project`](../apps/mobile/src/product/connectedDomain.ts#L745), [champs de lieu](../apps/mobile/src/product/CoachPlacesEditor.tsx), [préparation des clients](../apps/mobile/src/product/CoachConfiguration.tsx).

**Correction recommandée :** construire une liste explicite de champs publics. Séparer la présentation publique du lieu et les instructions accessibles aux participants autorisés. Définir ce que peuvent voir un visiteur, un client ayant réservé, le coach et l’équipe.

**Critère de fin :** tests négatifs prouvant qu’aucune consigne réservée n’apparaît dans la réponse anonyme ou celle d’un autre client, tout en conservant les adresses que le coach a explicitement publiées.

### P1 Effacement du compte incomplet

**Anomalie reproduite en mémoire et confirmée par lecture du traitement.** Après suppression d’un coach, son profil est retiré de la publication et plusieurs données sont anonymisées, mais ses lieux, leurs instructions, son adresse de studio et ses consignes de préparation restent dans les réglages métier.

La suppression des références aux justificatifs ne prouve pas la destruction des objets Storage. Si la suppression du compte Auth échoue après l’opération métier, la fonction écrit un message dans les logs et renvoie néanmoins `deleted: true` ; aucune reprise durable de cette étape n’est visible dans ce chemin. L’interface documente déjà certaines limites de l’effacement : cela reste une opération à finaliser, pas une conformité acquise.

Références : [`workflows.ts`, `_deleteAccount`](../apps/mobile/src/product/workflows.ts#L1492), [`product-api`, nettoyage Auth](../supabase/functions/product-api/index.ts#L263), [limites de confidentialité existantes](confidentialite-25.md).

**Correction recommandée :** une demande de suppression suivie côté serveur, avec étapes rejouables pour le domaine, Auth, Storage, jetons Calendar et appareils push ; conservation uniquement des éléments justifiés, avec règles explicites. Ne confirmer l’effacement complet que lorsque les étapes correspondantes sont effectivement terminées.

**Critère de fin :** supprimer un compte de recette avec photo, pièces et consignes ; contrôler l’absence des données à effacer, la révocation des accès et la reprise automatique après échec d’une étape. Tester également le parcours client.

Les deux constats sont reproductibles sans réseau avec [`audit-privacy-20260930.cjs`](../scripts/audit-privacy-20260930.cjs). Le script retourne actuellement un code d’échec car il détecte les défauts ; [résultat](audits/2026-09-30/domain-findings.json).

### P1 Rendre la validation des coachs exploitable

**Blocage d’exploitation constaté : aucun compte équipe habilité sur le serveur de développement.** Les contrôles de rôle et les parcours de dossier existent, mais aucun opérateur réel ne peut actuellement prendre en charge la file par cette habilitation.

La bonne suite consiste à désigner explicitement le compte de l’opérateur, puis tester dépôt, demande de correction, nouvelle soumission, décision par pratique et publication avec des comptes distincts. Il ne faut pas contourner la validation initiale du coach ni permettre l’auto-habilitation.

**Critère de fin :** un dossier de test passe par l’opérateur désigné et seules les pratiques validées deviennent réservables. Avant un grand volume, ajouter attribution des dossiers aux examinateurs, gestion des décisions concurrentes, relances et recherche/pagination côté serveur. Ces éléments de volume ne sont pas nécessaires pour commencer la petite recette encadrée.

### P1 Prouver le parcours connecté entre deux appareils

Les règles métier et protections de concurrence sont testées localement. L’audit du serveur vérifie les barrières d’accès, mais n’a pas rejoué de réservation entre deux comptes réels.

**Recette à effectuer :** coach sur WebApp, client sur iPhone ; réservation individuelle et dernière place d’un groupe, double clic, deux clients simultanés, modification, refus, annulation, message, déconnexion/reconnexion et coupure réseau. Vérifier le résultat des deux côtés et la conservation des données après redémarrage.

**Critère de fin :** aucun doublon, aucune place vendue deux fois, aucune action perdue silencieusement et aucune donnée affichée sous le mauvais compte. Faire cette recette sur la version native finale, pas seulement dans le cadre de simulation HTML.

## Accessibilité et ergonomie

### P2 Corriger les composants web communs

Le contrôle axe relève quatre familles de défauts dans l’échantillon. Les qualificatifs « serious » et « critical » du fichier JSON sont des niveaux de l’outil d’accessibilité, pas des niveaux de vulnérabilité serveur.

| Défaut confirmé | Impact probable | Correction attendue |
| --- | --- | --- |
| Carte coach cliquable contenant d’autres contrôles interactifs | Lecture et navigation au clavier ambiguës entre profil, favori et créneau | Zone de profil et actions séparées, sans boutons imbriqués |
| Navigation mobile web avec rôles `tab` sans parent `tablist` | Structure incomplète pour les lecteurs d’écran | Employer une navigation sémantique appropriée, ou compléter correctement le modèle d’onglets |
| Curseur du budget sans `aria-valuenow` | Valeur non explicitée par le rôle slider | Valeur, bornes et libellé accessibles ; tester le clavier |
| Fond cliquable des fenêtres avec `aria-label` sans rôle adapté | Contrôle de fermeture mal exposé | Fond non focalisable si purement décoratif, bouton de fermeture explicite et gestion du focus |

Références : [`ProductApp.tsx`](../apps/mobile/src/product/ProductApp.tsx#L1200), [navigation](../apps/mobile/src/product/ProductApp.tsx#L5783), [budget](../apps/mobile/src/product/ProductApp.tsx#L4549), [`Dialog` partagé](../apps/mobile/src/product/ui.tsx#L713).

La langue du document rendu est bien `fr`. Aucun débordement horizontal global n’a été détecté dans les 20 états. Des contrôles mesurés sous 44 px constituent un signal ergonomique à revoir, pas à eux seuls une preuve de non-conformité. Le focus, VoiceOver et les grandes tailles de texte demandent une recette manuelle complémentaire.

### Ce qui fonctionne visuellement

La direction monochrome, les pilules et la hiérarchie sont conservées. L’ordinateur dispose d’une vraie navigation latérale et d’un espace de travail, tandis que le téléphone affiche une tâche à la fois. La séparation disponibilités/rendez-vous, l’éditeur semaine → jour → plage et les retours successifs sont plus lisibles que la liste exhaustive initiale. Les tests actuels de densité et de navigation passent.

### Améliorations ciblées proposées

- **Enregistrement des disponibilités :** « Appliquer à la journée » puis « Enregistrer les modifications » reste une validation en deux temps. Le texte l’explique, mais il faut tester la compréhension avec un coach. Rendre l’état « modifications non enregistrées » explicite au bon endroit, sans remettre des messages répétitifs partout.
- **Réglages sur ordinateur :** la navigation globale, les catégories de réglages et les jours de la semaine forment trois colonnes de navigation. Cela reste utilisable à 1440 px, mais mérite un essai en fenêtre réduite et à zoom 200 %. Garder le contexte, puis réduire les colonnes secondaires lorsque la place manque.
- **Résultats client :** dans la fixture examinée, « Square Maurice-Gardette » apparaît deux fois dans la ligne des lieux d’un coach. Dédupliquer les lieux équivalents dans la présentation et conserver leur détail dans le profil. Constat de démonstration, sans extrapolation aux comptes réels.
- **Documents :** garder les pièces communes, puis les qualifications par pratique, avec la prochaine action et l’état du dossier. Les tests du parcours adapté passent ; la priorité est désormais de l’exploiter avec un véritable opérateur, pas d’ajouter des justificatifs sans nécessité.
- **Notifications et messages :** la séparation est pertinente ; le scénario volumineux teste 446 événements et limite le montage initial des lignes. Cette pagination visuelle ne dispense pas d’une pagination des données sur le serveur à terme.

Captures examinées : [disponibilités ordinateur](audits/2026-09-30/coach-availability-1440.png), [édition mobile](audits/2026-09-30/coach-editor-390.png), [découverte à 320 px](audits/2026-09-30/client-home-320.png).

## Authentification et intégrations

| Fonction | État constaté | Étape restante |
| --- | --- | --- |
| Apple et Google | Fournisseurs activés côté serveur ; parcours et courses de session couverts par tests simulés ; validations personnelles antérieures documentées | Rejouer succès, abandon, retour depuis le navigateur, expiration et reconnexion sur le dernier iPhone buildé ; testeur Google hors compte propriétaire |
| E-mail | L’interface gère le lien reçu et permet un code lorsque l’e-mail en contient un | La demande d’un e-mail français à code n’est pas achevée : régler et tester le modèle Auth, la saisie, l’expiration et le renvoi ; préparer l’expéditeur pour la distribution |
| Push iPhone | Fonctions et planification présentes ; **0 appareil enregistré** et file vide au moment de l’audit | Enregistrer un vrai token, vérifier la réception en premier plan/arrière-plan/app fermée, ouverture de la bonne séance, refus et déconnexion ; vérifier l’environnement Production pour TestFlight |
| Google Calendar | Fonction et tâche planifiée actives ; **0 connexion d’agenda enregistrée** | Consentement réel, import d’occupation, création/modification/annulation, expiration du jeton et conflit avec une réservation |
| Apple Calendar | Ajout/export de séance | Vérifier sur appareil ; ne pas annoncer une synchronisation iCloud bidirectionnelle |
| Carte et secteurs | Parcours existants, tests de résolution de secteur réussis | Essais d’adresse ambiguë, réseau indisponible et rendu sur appareil ; distances indicatives, pas des temps de déplacement |
| Paiement et versements | Simulation toujours présente | Stripe Connect et sa recette financière complète restent nécessaires avant des réservations payantes réelles ; aucun encaissement validé |

Les tâches planifiées ont enregistré, sur les dernières 24 heures consultées, 1440 exécutions push, 288 Calendar et 24 nettoyages avec succès côté planificateur. **Ces succès prouvent l’exécution des tâches, pas la livraison d’une notification ou la synchronisation d’un agenda sans appareil/connexion enregistré.**

Outlook, SMS, push Android/navigateur et abonnements professionnels restent hors du MVP actuellement repris. Leur absence n’est pas un bug à corriger implicitement.

## Sécurité et confidentialité du serveur

### Protections vérifiées

- RLS active sur les tables examinées ; pas de droit direct `anon`/`authenticated` sur les tables métier privées. Les RPC privilégiées de chargement, écriture et traitement des services ne sont pas exécutables par ces rôles.
- Documents dans un bucket privé ; politiques de lecture/écriture liées au dossier de l’utilisateur et accès équipe contrôlé. Photos dans un bucket public, conformément à leur usage de profil. Limites de taille et types de fichiers définis.
- Les requêtes anonymes vers les écritures métier, profils privés, réservations, appareils push et services Calendar ont été rejetées.
- Les fonctions Edge avec `verify_jwt=false` ne sont pas automatiquement ouvertes : les gestionnaires contrôlent eux-mêmes l’identité ou le secret de tâche. L’audit vérifie ces protections ; il ne se limite pas à lire ce drapeau.
- Les alertes informatives « RLS activée sans politique » concernent ici des tables volontairement accessibles uniquement au backend. L’audit de performance Supabase ne remonte pas de finding.
- Aucun secret détecté par la recherche ciblée des fichiers versionnés : cela ne remplace pas une analyse exhaustive de tout l’historique Git.

Ces contrôles ne neutralisent pas le défaut de projection publique décrit plus haut : protéger une table ne suffit pas si l’API renvoie ensuite trop de champs.

### Durcissements à prévoir

**Session native :** la session Supabase persiste dans AsyncStorage ([configuration](../apps/mobile/src/lib/supabase.ts#L34)). Évaluer et intégrer un stockage adapté au trousseau iOS avec migration et déconnexion testées. Il s’agit d’un durcissement ; aucune extraction de jeton sur appareil n’a été démontrée.

**Confidentialité publiée :** les champs d’identité du responsable et de contact sont encore vides dans [`privacyContent.ts`](../apps/mobile/src/product/privacyContent.ts#L5). Finaliser l’information réelle, la gestion des demandes, les durées de conservation et les purges avant l’ouverture publique. L’existence d’un écran ou d’un consentement à l’inscription ne démontre pas à elle seule la conformité.

**Maintenance Postgres :** version observée 17.6. Supabase a annoncé des correctifs dans la branche 17.11 : prévoir sauvegarde, revue de compatibilité, mise à jour et recette. L’absence de l’extension `ltree` et d’index GiST sur flottants dans les contrôles effectués réduit certains cas particuliers ; elle ne rend pas la maintenance inutile. [Note officielle Supabase](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).

**Alerte mots de passe compromis :** protection désactivée selon l’advisor. Le parcours actuel est sans mot de passe ; cette alerte doit être requalifiée si un parcours à mot de passe est ajouté, plutôt que présentée comme un blocage actuel de Google/Apple.

## Architecture et exploitation

Le partage React Native/React Native Web reste une bonne base : mêmes commandes, mêmes contrôles métier et mêmes états de compte. Les adaptations visuelles desktop sont déjà séparées. Il n’y a pas d’intérêt à créer deux applications métier indépendantes pour résoudre les problèmes relevés.

**Limite de volume :** le backend charge les documents métier JSON et s’appuie sur une révision globale et un verrou de commit. Cette stratégie protège les petites opérations concurrentes, mais peut provoquer des conflits entre utilisateurs sans relation et des traitements croissants. La base métier observée ne contient qu’environ 8 Ko de documents : aucune conclusion de capacité réelle n’est possible avec ce volume.

Avant un grand déploiement, mesurer les latences et conflits sur une volumétrie convenue, puis faire évoluer les domaines sollicités vers des requêtes ciblées et une pagination serveur. Voir [migration du stockage et des commits](../supabase/migrations/20260916211333_connected_product_workflows.sql). La performance du navigateur avec des fixtures ne mesure pas celle d’un serveur chargé.

**Exploitation :** définir suivi des erreurs, alerte sur les tâches en échec, traitement de la file push, relance des suppressions et procédure de restauration. Tester une restauration dans un environnement isolé ; la simple existence d’une sauvegarde ne suffit pas.

**Maintenabilité :** `ProductApp.tsx` dépasse 6000 lignes. Extraire progressivement les écrans et composants touchés par les corrections, avec les tests correspondants ; éviter une refonte générale qui risquerait de casser la parité validée. Aucun workflow CI n’est présent dans `.github` dans la révision auditée.

## Dépendances et fiabilité de la recette

Expo signale six mises à jour correctives compatibles : `expo` 57.0.24 → 57.0.26, `expo-auth-session` 57.0.12 → 57.0.13, `expo-document-picker` 57.0.2 → 57.0.3, `expo-image-picker` 57.0.19 → 57.0.20, `expo-notifications` 57.0.20 → 57.0.21 et `expo-sharing` 57.0.21 → 57.0.22. Les appliquer dans un lot dédié, puis reconstruire le natif et rejouer les parcours concernés. Aucune version n’a été modifiée pendant cet audit.

L’autre avertissement Expo concerne le maintien d’une configuration native versionnée en parallèle de `app.json`. Il faut contrôler leur cohérence ; ne pas supprimer le dossier iOS ou régénérer avec `--clean` pour faire disparaître l’avertissement.

La recette isolée emploie Node 24.19.0 ; le script ReactCodegen du workspace local utilise Node 26.8.2. Aligner ou documenter ces environnements améliorera la reproductibilité. Ce décalage n’a pas été démontré comme la cause du délai de compilation.

Les anciens tests de disponibilités et la variante coach du test de confidentialité attendent des écrans désormais remplacés. Mettre à jour leurs sélecteurs et leurs parcours, conserver les assertions métier utiles et intégrer une commande de recette reproductible en CI. Remplacer les attentes fixes par l’attente d’un état explicite dans le test de notifications. Ne pas masquer ces échecs en les présentant comme des réussites.

## Plan de sortie recommandé

| Ordre | Lot | Condition de validation |
| --- | --- | --- |
| 1 | Projection publique et effacement | Tests négatifs de confidentialité, purge/reprise démontrées sur comptes de recette |
| 2 | Accessibilité commune et tests obsolètes | Contrôles axe traités, clavier et VoiceOver vérifiés, recette reproductible |
| 3 | Compte équipe et parcours connecté | Dossier traité par un opérateur désigné ; réservation cohérente coach web/client iPhone |
| 4 | Push, Calendar et authentification finale | Preuves de réception et d’échanges réels sur appareils ; cas d’échec et reconnexion validés |
| 5 | Distribution et exploitation | Build final testé, maintenance dépendances/serveur, information confidentialité, alertes et restauration |
| Avant commercialisation | Paiement marketplace | Encaissement, commission, annulation/remboursement et versement validés de bout en bout en environnement de test, puis configuration réelle maîtrisée |
| Avant montée en charge | Données et revue des dossiers | Volume cible mesuré, pagination serveur, gestion de plusieurs examinateurs et conflits |

**Décision proposée :** conserver le périmètre fonctionnel actuel et traiter ces lots. L’application mérite maintenant une recette réelle et des garanties d’exploitation, plus qu’une nouvelle accumulation d’écrans.

## Reproduire les contrôles ajoutés

Depuis la racine du dépôt, après `npm ci` dans `apps/mobile` :

```sh
node --no-experimental-strip-types scripts/audit-privacy-20260930.cjs
```

Cette commande est entièrement locale et retourne 1 lorsque les constats sont présents. Elle ne touche ni Supabase ni les fichiers utilisateurs.

Pour le complément visuel, servir un export web récent puis exécuter [`audit-ui-20260930.cjs`](../scripts/audit-ui-20260930.cjs). Il nécessite Playwright et axe-core disponibles dans l’environnement QA. Les variables `PARTANT_QA_URL`, `PARTANT_QA_PLAYWRIGHT`, `PARTANT_QA_CHROME`, `PARTANT_QA_AXE` et `PARTANT_AUDIT_OUTPUT` permettent de choisir le serveur, les outils et le dossier de sortie. Le script force `data=preview` et emploie des fixtures locales. Les 20 captures ne sont pas toutes versionnées ; trois exemples et les résultats structurés accompagnent ce rapport.
