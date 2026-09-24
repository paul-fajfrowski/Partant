# Partant — réalisé, reste à faire et reprise du projet

**Point de situation au 24 septembre 2026 · destiné à la reprise par un collègue.**  
État du code jusqu’à la livraison 32, commit `676c28b`. Ce document synthétise les sources, les recettes documentées et les validations du propriétaire ; ce n’est pas un nouvel audit des services déployés.

Partant est une marketplace locale de coachs sportifs, centrée sur leurs disponibilités et la réservation. Le cœur fonctionnel existe dans une application React Native et une WebApp partageant leur code. Un serveur de développement est raccordé. **L’application n’est pas encore prête pour un lancement commercial : le paiement reste simulé et plusieurs validations réelles sont à terminer.**

## 1. Architecture et règles de travail

| Élément | État / emplacement |
| --- | --- |
| Application de référence pour le développement | `apps/mobile` : React Native, TypeScript, Expo SDK 57. Les évolutions produit se font ici. |
| WebApp ordinateur | React Native Web, composants desktop dans `apps/mobile/src/product/web` et `web-agenda`. `apps/web` contient les commandes de construction et de prévisualisation. |
| Backend de développement | Supabase : authentification, stockage privé, API métier, tâches planifiées et fonctions d’intégration. Sources dans `supabase`, scripts dans `scripts`. |
| Projet iPhone | Workspace versionné : `apps/mobile/ios/Partant.xcworkspace`. Préserver les correctifs de compilation et le postinstall existants. |
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

- Déconnexion et transitions de connexion améliorées ; séparation des espaces réels et exploration protégée.
- Dossier simplifié autour des pièces communes, des pratiques et de la prochaine action.
- Retours de navigation : journée → semaine → origine ; sous-fenêtre → étape précédente ; confirmation refermée avant de quitter la page. Conservation des brouillons de disponibilités et aucun retour au paiement après une confirmation.

Détails : [WebApp](docs/webapp-27.md), [dossiers](docs/documents-verifications-26.md), [connexion et dossier](docs/auth-documents-28.md), [agenda](docs/agenda-densite-30.md), [éditeur de disponibilités](docs/disponibilites-editeur-31.md), [retours](docs/navigation-retours-32.md).

## 3. Intégrations : état réel

| Service | Ce qui existe | Ce qu’il reste à valider ou réaliser |
| --- | --- | --- |
| Supabase | API métier, droits par compte, documents privés, protections de concurrence/idempotence, maintenance planifiée et file de push. | Recette complète entre appareils, évolution du stockage et tests de charge. |
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

## 4. Ce qui a été testé — et ce qui ne l’a pas encore été

- Suites de règles métier, tests DOM, tests navigateur et recettes serveur documentées par livraison. Les essais connectés QA antérieurs sont distincts de la démonstration locale.
- Dernière livraison navigation : **328 contrôles réussis**, dont tests Chromium aux largeurs 390, 1280 et 1440 px, régressions de l’éditeur et des parcours client/coach. TypeScript et export web/iOS Hermes réussis.
- Le propriétaire a déjà réussi un build iPhone, validé Apple natif et testé plusieurs parcours. **Cela ne valide pas automatiquement le dernier code livré.**
- Un export Hermes n’est pas un build Xcode signé ; une simulation web n’est pas un simulateur iOS natif. Un paiement simulé n’est pas un test bancaire.
- Restent notamment : recette connectée complète avec deux comptes, derniers changements sur iPhone, push réels, Google Calendar réel, Safari/Firefox, accessibilité et essais de charge. Android n’a pas de validation appareil complète documentée.

Le nombre de contrôles est une preuve sur les scénarios listés, pas un pourcentage d’achèvement du MVP ni une garantie d’absence de bugs.

## 5. Prochaines étapes, dans l’ordre recommandé

| Priorité | Travail | Critère de fin |
| --- | --- | --- |
| **1 — Exploiter les dossiers** | Le propriétaire désigne un compte confirmé distinct du coach examiné ; habilitation explicite, puis dépôt/correction/validation/publication. | Un vrai compte équipe peut traiter un dossier de test et seules les pratiques autorisées ouvrent la réservation. |
| **2 — Recette connectée complète** | Coach sur ordinateur, client sur iPhone : individuel/groupe, dernière place simultanée, modifications, annulations, messages, reconnexion et coupure réseau. | Pas de blocage ; état cohérent des deux côtés ; aucun doublon de réservation. |
| **3 — Valider les services déjà branchés** | Réception push et navigation associée ; échanges réels Google Calendar. | Résultats documentés sur appareils et agenda réels, y compris les erreurs et refus. |
| **4 — Paiement marketplace** | D’abord en environnement de test : onboarding financier coach, paiement, commission, remboursement, versement, événements serveur et reprises. | Parcours financier complet, testé côté serveur avant tout encaissement réel. Cette intégration reste reportée jusqu’à reprise explicite. |
| **5 — Préparer la bêta distribuée** | Expéditeur e-mail, domaine/hébergement, callbacks, environnement APNs Production, signature et TestFlight, suivi des erreurs et procédure de reprise. | Un testeur externe peut installer ou ouvrir l’app et terminer le parcours sans outils de démo. |
| **Avant ouverture publique — Confidentialité et exploitation** | Informations juridiques/contact, règles de conservation, purges, export/effacement inter-systèmes, traitement des demandes, notice/conditions et déclarations de distribution. | Les engagements affichés correspondent à des procédures réellement opérationnelles et validées. |
| **Avant un volume important — Données et charge** | Faire évoluer les documents JSON et la révision globale, réduire les conflits entre utilisateurs, paginer/rechercher côté serveur ; tester montée en charge et restauration. | Capacité mesurée sur un volume cible convenu, sans perte ni fuite de données. |

L’espace Confidentialité existe, mais l’effacement actuel est partiel et **la conformité RGPD complète n’est pas déclarée**. Les qualifications des coachs restent à examiner humainement ; l’interface ne fournit pas une certification réglementaire automatique. Voir [les limites de confidentialité](docs/confidentialite-25.md).

SMS, Outlook, synchronisation iCloud, push navigateur, abonnements professionnels et fonctionnalités commerciales supplémentaires ne sont pas nécessaires pour poursuivre la recette actuelle. Ne pas les ajouter implicitement au périmètre.

## 6. Reprendre le projet sans confondre démo et connecté

1. Cloner le dépôt puis lire ce fichier et `AGENTS.md`. Certains documents plus anciens contiennent des états historiques désormais remplacés ; privilégier la livraison la plus récente sur le sujet.
2. Installer les dépendances dans `apps/mobile` avec `npm ci`. Préparer le `.env` local à partir de `.env.example` si nécessaire ; obtenir la configuration de développement auprès du propriétaire. Aucune clé serveur dans `EXPO_PUBLIC_*`.
3. Pour le web, depuis la racine : `npm --prefix apps/web run dev`. Ouvrir l’adresse affichée par le serveur ; éviter de démarrer un deuxième serveur sur un port occupé.
4. `/?data=preview` = données fictives locales ; `/?data=connected` = comptes et données du serveur de développement. `simulation.html` affiche le parcours mobile dans un cadre, `web.html` ouvre la WebApp.
5. Pour iOS, après installation des dépendances, suivre le guide local et exécuter `pod install` dans `apps/mobile/ios` si nécessaire ; ouvrir **`Partant.xcworkspace`** dans Xcode. Ne pas régénérer iOS avec `--clean` ni supprimer les correctifs existants pour une simple mise à jour TypeScript.
6. Ne pas lancer de recette destructive ou injecter des données de démonstration sur le compte réel du propriétaire. Les exemples fictifs ne sont pas des identifiants Supabase.

Guides : [WebApp](apps/web/README.md), [application mobile](apps/mobile/README.md), [configuration native](docs/native-auth-19.md), [dépendances/Xcode](docs/dependency-audit-22.md), [serveur et push](docs/backend-push-23.md).

**Prochaine action concrète : désigner le compte équipe, puis exécuter une recette complète coach/client avant d’ajouter de nouvelles fonctionnalités.**
