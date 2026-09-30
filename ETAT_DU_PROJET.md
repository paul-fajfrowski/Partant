# Partant — réalisé, reste à faire et reprise du projet

**Mis à jour le 30 septembre 2026 — point d’entrée pour reprendre le projet.**
Couvre les corrections techniques (livraison 33), les dix améliorations UX/UI (livraison 34) et la configuration Xcode `326eb1a`. Les résultats ci-dessous sont ceux des recettes documentées ; cette mise à jour documentaire ne constitue pas une nouvelle recette appareil ou serveur.

Lire ce document en premier, puis le [détail des corrections et limites](docs/corrections-audit-33.md). L’[audit initial](docs/audit-app-webapp-2026-09-30.md) conserve volontairement les défauts observés avant correction : ne pas les considérer tous comme encore ouverts.

## À retenir pour reprendre

- **Une seule source produit** pour l’app native et la WebApp, avec modes connecté et démonstration. Pas de seconde application à recopier ; le HTML reste une archive.
- **Les défauts de confidentialité, de stockage de session natif, d’accessibilité web et de navigation des notifications identifiés dans l’audit ont reçu leurs correctifs.** Les changements serveur correspondants sont déployés sur le projet de développement.
- **Les tests automatisés sont concluants dans leur périmètre**, mais le dernier build natif signé n’est pas validé : la compilation locale a manqué d’espace disque.
- **Le MVP commercial reste ouvert** : habilitation équipe, recette réelle iPhone/agenda/push, paiement, confidentialité opérationnelle et préparation de la distribution.
- **Première action du collègue :** récupérer `main`, préparer son environnement (section 6), compiler puis exécuter la recette à deux comptes. Ne pas utiliser les anciens dossiers ou binaires comme preuve de mise à jour.

Partant est une marketplace locale de coachs sportifs, centrée sur leurs disponibilités et la réservation. Le cœur fonctionnel existe dans une application React Native et une WebApp partageant leur code. Un serveur de développement est raccordé. **L’application n’est pas encore prête pour un lancement commercial : le paiement reste simulé et plusieurs validations réelles sont à terminer.**

## 1. Architecture et règles de travail

| Élément | État / emplacement |
| --- | --- |
| Application de référence pour le développement | `apps/mobile` : React Native, TypeScript, Expo SDK 57. Les évolutions produit se font ici. |
| WebApp ordinateur | React Native Web, composants desktop dans `apps/mobile/src/product/web` et `web-agenda`. `apps/web` contient les commandes de construction et de prévisualisation. |
| Backend de développement | Supabase : authentification, stockage privé, API métier, tâches planifiées et fonctions d’intégration. Sources dans `supabase`, scripts dans `scripts`. |
| Projet iPhone | `Ouvrir Partant.command` ouvre le workspace de sa propre copie : `apps/mobile/ios/Partant.xcworkspace`. Schéma Partant en Release, données connectées par défaut. Préserver les correctifs de compilation et le postinstall existants. |
| Prototype HTML | `outputs/partant.html`, archive autonome et référence visuelle validée. Ne pas poursuivre les évolutions produit dans cette copie. |
| Documentation | `docs` : livraisons techniques et recettes ; `outputs/*.md` : benchmark et historique produit. Lire aussi `AGENTS.md`. |

Le web et le téléphone utilisent les mêmes comptes et commandes serveur en mode connecté. La synchronisation recharge périodiquement les données enregistrées ; **les brouillons locaux et la position de navigation ne sont pas synchronisés**.

La direction artistique reste monochrome, Hanken Grotesk, boutons pilules, surfaces arrondies et photographie. Le repository Project-H-iOS est uniquement une référence en lecture seule.

## 2. Fonctionnalités déjà réalisées

« Réalisé » signifie que le parcours est implémenté, pas que tous ses cas ont été validés en production.

### Côté client

- Entrées client/coach, inscription, connexion et onboarding selon pratique, objectif, budget et secteur.
- Exploration sans compte ; authentification demandée pour les actions importantes. Pas de bascule libre client/coach pour les comptes réels.
- Découverte locale, recherche, filtres sportifs et temporels, carte, comparaison, profils, avis et favoris.
- Disponibilités visibles ; choix du créneau, de l’offre et du lieu ; individuel, duo et cours collectifs.
- Récapitulatif, confirmation, séances futures/passées, modification, annulation, réservation à nouveau et avis.
- Parcours de récurrence, propositions d’un coach, transfert de cours et annulation partielle de places ; aucun débit récurrent réel.
- Messagerie regroupée par personne, brouillons et reprise d’envoi ; notifications par rubrique et chronologie, pagination visuelle, accès aux actions en attente. Les messages ont leur propre rubrique et badge.
- Compte, préférences, assistance et confidentialité.

### Côté coach

- Profil, disciplines, offres, durée, prix, formats individuel/duo/groupe et capacité maximale du groupe.
- Lieux personnalisables : adresses, lieux associés aux offres/plages, intervention à domicile et zone de déplacement.
- Horaires choisis par le coach, sans cadence imposée : semaine → journée → plage. Édition ciblée, détection des chevauchements, duplication et copie de journée confirmée.
- Modifications ponctuelles d’une date, fermeture/réouverture de départs ; conservation des réservations existantes.
- Agenda distinguant disponibilités et rendez-vous, fiche de plage cliquable, présentation compacte quand une journée est chargée ; vue hebdomadaire sur ordinateur et fil journalier sur mobile.
- Réservations, groupes, clients, rendez-vous hors Partant, propositions de modification, annulations, consignes et suivi d’activité.
- Dossier professionnel : pièces communes, justificatifs adaptés aux pratiques/statuts, bibliothèque réutilisable, validités et suivi par discipline. Le dossier reste une étape initiale ; publication conditionnée à la vérification.
- Réglages des agendas, notifications, compte et présentation des paiements/versements. **La présentation financière n’est pas une intégration bancaire : aucun IBAN ni versement réel n’est opérationnel.**

### Côté équipe

- Espace web avec file de dossiers, recherche, catégories, pagination visuelle, consultation des preuves, demandes de correction et décisions par pratique avec historique.
- Contrôles d’habilitation côté serveur ; pas d’auto-validation d’un dossier réel.
- **Le compte équipe du propriétaire reste à désigner et à habiliter.** Le système a été testé avec des comptes QA distincts, nettoyés après recette.
- La répartition entre plusieurs examinateurs et la pagination/recherche côté serveur restent à ajouter pour un volume important.

### Dernières corrections transversales

- Projection publique limitée aux champs autorisés : consignes privées réservées aux participants d’une réservation.
- Suppression de compte : anonymisation/effacement métier, révocation des appareils/agendas, file privée persistante de purge des fichiers puis du compte Auth, avec reprise sur échec et refus des anciens accès.
- Sessions natives migrées vers SecureStore ; traitement des interruptions et retrait de l’ancienne copie AsyncStorage après migration. Stockage web inchangé.
- Accessibilité : séparation profil/favori, structure d’onglets, curseur du budget, focus des fenêtres ; libellés de lieux dédupliqués.
- Disponibilités : état de brouillon unique ; lecture des notifications sans attente globale inutile, retour au chapitre et à sa pagination.
- Dépendances Expo actualisées, recette locale reproductible, intégration continue GitHub et contrôles d’exploitation/sauvegarde ajoutés.
- Déconnexion et transitions de connexion améliorées ; séparation des espaces réels et exploration protégée.
- Dossier simplifié autour des pièces communes, des pratiques et de la prochaine action.
- Retours de navigation : journée → semaine → origine ; sous-fenêtre → étape précédente ; confirmation refermée avant de quitter la page. Conservation des brouillons de disponibilités et aucun retour au paiement après une confirmation.

Détails : [WebApp](docs/webapp-27.md), [dossiers](docs/documents-verifications-26.md), [connexion et dossier](docs/auth-documents-28.md), [agenda](docs/agenda-densite-30.md), [éditeur de disponibilités](docs/disponibilites-editeur-31.md), [retours](docs/navigation-retours-32.md).

## 3. Intégrations : état réel

| Service | Ce qui existe | Ce qu’il reste à valider ou réaliser |
| --- | --- | --- |
| Supabase | API métier, droits par compte, documents privés, protections de concurrence/idempotence, maintenance, file de push et purge durable de compte. Correctifs serveur 33 déployés. | Recette complète entre appareils, maintenance du moteur, évolution du stockage et tests de charge. |
| Apple — connexion | Connexion web et module natif iOS ; fonctionnement confirmé par le propriétaire. | Refaire une recette des cas secondaires après les dernières modifications. Renouvellement du secret web documenté pour mars 2027. |
| Google — connexion | Connexion confirmée avec le compte ajouté aux utilisateurs de test. | Recette native complète et préparation de l’accès aux futurs utilisateurs hors liste de test. |
| Connexion par e-mail | Envoi via le fournisseur standard ; parcours adapté au lien reçu, code possible si présent dans l’e-mail. | Expéditeur personnalisé, réception réelle et activation du modèle français à code. Ne pas annoncer que l’OTP demandé remplace déjà le lien. |
| Google Calendar | OAuth, synchronisation planifiée et contrôle des occupations implémentés. | Consentement réel et recette création/modification/annulation/conflits sur un agenda réel. |
| Apple Calendar | Ajout/export d’une séance au calendrier. | Pas de synchronisation iCloud bidirectionnelle. |
| Carte et secteur | Carte, géocodage IGN, sélection de communes/arrondissements et distances indicatives. | Recette appareil et cas réseau ; ce n’est pas un calcul de temps de trajet. |
| Push iPhone | APNs configuré côté serveur en Sandbox ; préférences et ouverture vers les parcours prévus. | Réception réelle, arrière-plan/app fermée, refus de permission et déconnexion. Configuration Production avant TestFlight. Le propriétaire indique une clé compatible avec les deux environnements. |
| Paiement / banque | Parcours et données de paiement simulés. | Stripe Connect, comptes coach, encaissement, commission, remboursement, versement, rapprochement et gestion des échecs. |
| Autres communications | Notifications internes et messagerie disponibles. | SMS, e-mails transactionnels personnalisés, push Android et push navigateur non finalisés / non implémentés selon le service. Outlook reporté. |

Aucun domaine Partant n’a été acheté dans ce travail. Les secrets, `.env`, clés Apple/Google, caches et exports ne sont pas versionnés. **Git ne sauvegarde pas les données ni les réglages des consoles externes.**

## 4. Ce qui a été testé — et les limites

| Vérification après corrections | Résultat documenté | Limite |
| --- | --- | --- |
| TypeScript, export web et bundle iOS Hermes | Réussis | Aucun de ces contrôles ne signe ni n’installe une application iPhone. |
| Règles métier et composants DOM | 41/41 suites réussies | Scénarios automatisés, fournisseurs simulés selon le test. |
| Navigateur Chromium | 8/8 suites : les 6 parcours existants, clavier/focus et retour des notifications | Ne remplace pas Safari, Firefox, VoiceOver ou le clavier iPhone. |
| Accessibilité responsive | 20 états aux largeurs 320, 390, 820 et 1440 px ; aucune violation axe ni débordement détecté | Pas une certification d’accessibilité ; grandes polices et lecteur d’écran réels à tester. |
| API de développement | 36 contrôles API/Auth/concurrence/Storage + 10 contrôles de confidentialité/effacement | Comptes et fichiers QA dédiés nettoyés ; aucun compte réel effacé. |
| Intégration continue | [Exécution GitHub réussie sur `6b681b3`](https://github.com/paul-fajfrowski/Partant/actions/runs/36718480589) | Tests sans secrets serveur ; pas de déploiement ni de build Xcode dans cette CI. Consulter les exécutions suivantes pour les commits ultérieurs. |
| Dépendances | Audit npm : zéro vulnérabilité remontée ; alignement Expo vérifié ; Doctor 20/21 | Avis conservé pour la synchronisation manuelle de la configuration native versionnée. |
| Projet Xcode | Pods installés, fichiers de verrouillage cohérents et contrôles de configuration réussis | Deux builds simulateur arrêtés par « No space left on device » ; dernier build signé non validé. |
| Sauvegarde | Reconstruction des données métier vérifiée dans une table temporaire isolée | Ne couvre pas la restauration complète Auth, Storage, secrets et paramètres externes. |

Preuves : [règles et DOM](docs/audits/2026-09-30-corrections/unit-dom.json), [navigateur](docs/audits/2026-09-30-corrections/browser.json), [accessibilité](docs/audits/2026-09-30-corrections/accessibility.json), [serveur, nettoyage et compilation](docs/audits/2026-09-30-corrections/verification.json).

Au contrôle serveur du 30 septembre : aucun appareil push, aucune connexion Calendar et aucun compte équipe enregistré. Aucun nettoyage de compte en attente ; fixtures QA nettoyées. **Ce sont des observations datées, pas une surveillance en temps réel.**

Le propriétaire avait validé Apple natif, Google et plusieurs parcours dans des versions précédentes. Ces validations ne couvrent pas automatiquement les derniers changements, notamment la migration SecureStore. Un test métier simulé, un export Hermes et un build iPhone sont trois niveaux distincts.

## Améliorations UX/UI — livraison 34

Les dix recommandations de l’[audit UX/UI avec captures](docs/audit-ux-ui-2026-09-30.md) ont été mises en œuvre dans la source partagée : recherche et date préservées, annulation contextualisée, agenda coach priorisé, offres dans un éditeur dédié, erreurs au niveau des champs, états de sauvegarde, états vides et composition desktop. Voir [la livraison 34 et ses preuves](docs/corrections-ux-ui-34.md). La recette 34 consolide 42 suites métier/DOM, 9 suites navigateur et les contrôles d’accessibilité des écrans modifiés. Les rapports historiques de la livraison 33 ci-dessus sont conservés. L’audit initial reste une photographie avant correction ; la validation physique du nouveau build iPhone reste à faire.

## 5. MVP restant, par ordre de priorité

Le socle fonctionnel permet de poursuivre les essais sans ajouter de nouvelles fonctionnalités. Les lignes ci-dessous séparent les validations manquantes des intégrations volontairement reportées.

| Priorité / statut | Travail restant | Dépendance / responsable | Critère de fin |
| --- | --- | --- | --- |
| **P0 — Prochaine recette** | Construire la dernière app iOS ; Apple/Google succès et abandon, reconnexion, migration de session, déconnexion, clavier, retours, préférences et VoiceOver. | Développeur avec accès Apple/signature et iPhone ; espace disque suffisant. | Build signé installé et fiche de recette du commit exact, sans blocage sur ces parcours. |
| **P0 — À habiliter** | Désigner le compte équipe, lui donner les droits puis tester dépôt → correction → validation/refus → publication par discipline. | Paul doit indiquer explicitement le compte ; aucun compte administrateur deviné. Script `scripts/configure-team-24.mjs`. | Un opérateur autorisé traite un dossier de test ; un coach ne peut pas s’auto-valider ni publier une pratique refusée. |
| **P0 — À rejouer en réel** | Coach WebApp et client iPhone : individuel/duo/groupe, dernière place concurrente, modification, annulation, messages, favoris, reconnexion et coupure réseau. | Deux comptes de test séparés ; serveur de développement. | États cohérents entre appareils, pas de double réservation, récupération après erreur documentée. |
| **P1 — Branché, à valider** | Push iPhone en premier plan/arrière-plan/app fermée, ouverture de la bonne séance, refus et déconnexion. Google Calendar : consentement, occupations, création/modification/annulation, conflit et expiration. | iPhone enregistré et agenda consenti ; aujourd’hui aucun résultat de réception/synchronisation réelle documenté. | Réception et échanges réels prouvés ; erreurs et reprises testées. |
| **P1 — Avant publication** | Identité juridique/contact, durées de conservation par catégorie, demandes utilisateurs, périmètre des sauvegardes, procédure de purge et déclarations de distribution. | Informations du propriétaire et validation appropriée des engagements. | Notice et pratiques opérationnelles concordantes ; suppression technique testée et limites expliquées. |
| **P1 — Reporté sur demande** | Paiement marketplace en test d’abord : Stripe Connect, onboarding financier coach, encaissement, commission, remboursement, versement, webhooks et reprises. | Reprise explicite par Paul, compte et configuration fournisseur. | Parcours financier complet testé côté serveur avant tout paiement réel. Aucun IBAN à collecter dans une solution provisoire. |
| **P1 — Avant bêta externe** | Domaine/hébergement, expéditeur e-mail, code français réellement reçu, callbacks, accès OAuth testeurs, signature/TestFlight et APNs Production. | Décisions du propriétaire sur services, comptes et éventuels coûts ; ne rien acheter implicitement. | Un testeur externe termine le parcours sans outillage de démo ; mode connecté et environnement push cohérents. |
| **P2 — Exploitation à compléter** | Maintenance Postgres hébergé après revue/sauvegarde, alertes actionnables, exercice de restauration Auth/fichiers/données/secrets sur environnement isolé. | Développeur/opérateur autorisé ; fenêtre de maintenance. | Version compatible et restauration mesurée, responsabilités et procédure d’incident documentées. |
| **P2 — Avant volume important** | Mesurer la charge ; normaliser les domaines sollicités, limiter les conflits de révision globale, recherche/pagination serveur et attribution des dossiers entre examinateurs. | Volumétrie cible à convenir. | Capacité mesurée et traitement concurrent des dossiers sans perte de données ni décisions contradictoires. |

**Confidentialité :** le défaut d’effacement partiel relevé dans l’audit a reçu un correctif métier + Storage + Auth, testé sur le serveur de développement. Il ne faut plus le présenter comme inchangé. En revanche, la conservation réglementaire, les sauvegardes et les données déjà exportées vers un tiers demandent des procédures distinctes ; la conformité complète n’est pas déclarée. Le [suivi 33](docs/corrections-audit-33.md) prévaut sur les limites techniques historiques de la livraison 25.

**Hors de la prochaine itération :** Outlook, SMS, synchronisation iCloud bidirectionnelle, push navigateur/Android, abonnements professionnels et nouvelles fonctionnalités commerciales. Ils ne bloquent pas la recette iPhone/WebApp actuelle. Une distribution Android nécessiterait sa propre recette appareil.

**Définition pratique de fin du MVP :** un coach vérifié configure une offre, un client réserve et paie, les deux retrouvent la même séance et ses modifications, l’équipe traite les incidents, et les droits/confidentialité sont opérationnels. Le paiement simulé suffit aux essais actuels, pas à cette validation commerciale.

## 6. Installation sur l’ordinateur du collègue

### Récupérer les sources

Cloner `https://github.com/paul-fajfrowski/Partant.git` ou mettre à jour sa copie de `main` après avoir préservé ses propres modifications. Travailler de préférence hors des dossiers synchronisés iCloud. Lire `AGENTS.md` avant toute modification.

Utiliser Node **24.19.0** (`.nvmrc`) puis, depuis la racine :

```sh
npm --prefix apps/mobile ci
cp -n apps/mobile/.env.example apps/mobile/.env
```

Renseigner uniquement la configuration publique de développement fournie par Paul dans `.env`. Ne jamais y mettre une clé serveur dans une variable `EXPO_PUBLIC_*`. Aucun secret ou jeton personnel ne doit être commité.

### Ouvrir Xcode

```sh
cd apps/mobile/ios
pod install
cd ../../..
./"Ouvrir Partant.command"
```

- Le lanceur ouvre **le workspace de cette copie**, avec CocoaPods, et non une ancienne entrée de l’historique Xcode.
- Le schéma partagé **Partant** utilise **Release** pour embarquer le JavaScript sans dépendre de Metro. `.xcode.env` fixe le mode **connecté** à la compilation ; Release ne signifie ni paiement réel ni publication App Store.
- Sur son Mac, vérifier que Xcode trouve son Node. Si besoin, créer `apps/mobile/ios/.xcode.env.local` avec `export NODE_BINARY="/chemin/absolu/vers/son/node"` (chemin obtenu avec `command -v node`). Ce fichier reste local ; ne pas reprendre le chemin Node de l’ordinateur de Paul.
- Sélectionner son iPhone et une équipe Apple autorisée pour le bundle `com.paulfajfrowski.partant`. Les droits Apple, certificats et profils de signature ne sont pas accordés par un clone Git.
- Préserver les correctifs natifs et le postinstall. Ne pas lancer `prebuild --clean` ni supprimer `ios` pour actualiser les écrans.
- SecureStore est une nouvelle dépendance native : **recompiler et réinstaller l’app** ; un simple rafraîchissement JavaScript ne suffit pas.
- Sur le Mac de Paul, le dernier build a manqué d’espace ; prévoir au moins 10 Go de marge avant un nouvel essai, davantage si Xcode le demande.

Pour une compilation native de démonstration, l’override local et sa remise à zéro sont documentés dans [apps/mobile/README.md](apps/mobile/README.md). Cette variante conserve le même bundle ID et remplace l’installation précédente : ce n’est pas une seconde app installable côte à côte.

### Ouvrir la WebApp ou la simulation

Depuis la racine : `npm --prefix apps/web run dev`, puis ouvrir l’adresse affichée. Éviter un deuxième serveur sur un port déjà utilisé.

| URL relative | Usage |
| --- | --- |
| `/?data=connected&surface=web` | WebApp et comptes du serveur de développement. |
| `/?data=preview&surface=web` | Même interface avec données fictives locales. |
| `/?data=preview&recette=coach-realiste-30&surface=web` | Scénario de coach réaliste isolé. |
| `/simulation.html?mode=connected` | Rendu mobile web encadré, connecté ; pas un simulateur iOS natif. |
| `/simulation.html?mode=coach` | Démonstration mobile du coach réaliste. |

La construction autonome web utilise `npm --prefix apps/web run build`. Les modifications partagées viennent de `apps/mobile` : ne pas dupliquer les écrans dans `apps/web` ou dans l’HTML archivé.

### Rejouer la recette

Installer aussi `npm --prefix tools/qa ci` et `npm --prefix services/calendar ci`, puis suivre les commandes de [reproduction de la livraison 33](docs/corrections-audit-33.md#reproduire-la-recette). Le workflow `.github/workflows/qa.yml` constitue la référence pour TypeScript, exports, tests DOM et navigateur.

Les tests connectés avec écritures nécessitent l’accès opérateur et des fixtures isolées avec nettoyage. Ne pas injecter les scénarios de démonstration sur le compte réel de Paul. La CI ne déploie pas les fonctions serveur et ne réalise aucun paiement.

## 7. Transfert et limites à ne pas oublier

- Git contient le code et les migrations, **pas** les données, secrets, clés `.p8`, `.env`, habilitations ou réglages des consoles Apple/Google/Supabase. Demander les accès nécessaires séparément, jamais dans un commit.
- La copie à jour de Paul est `/Users/paulf/Developer/Partant-audit-33`. L’ancienne copie sous Documents a renvoyé une erreur macOS d’authentification cloud ; elle n’est pas déclarée synchronisée. Le collègue doit cloner son propre dossier, sans reproduire ce chemin absolu.
- Un changement des règles métier partagées nécessite de régénérer le domaine serveur et de maintenir `product-api`, `google-calendar` et `push-dispatch` synchronisés. Voir `AGENTS.md` ; un push Git seul ne déploie rien sur Supabase.
- Le secret Apple web doit être renouvelé avant son expiration documentée du **17 mars 2027** ; suivre [le guide Apple](docs/configurer-apple.md). Ne pas exposer la clé privée.
- Aucun achat, paiement réel, publication ou nouvelle intégration reportée n’est autorisé implicitement par ce récapitulatif.

Guides : [WebApp](apps/web/README.md), [mobile/Xcode](apps/mobile/README.md), [corrections et recette](docs/corrections-audit-33.md), [serveur et push](docs/backend-push-23.md), [dossiers professionnels](docs/documents-verifications-26.md).
