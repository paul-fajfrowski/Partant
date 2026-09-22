# WebApp Partant — livraison 27

Demande explicite du 22 septembre 2026 : préparer en parallèle une application web adaptée à l’ordinateur, en conservant la direction artistique et tous les parcours existants. La WebApp reste locale, sans publication publique ni nouveau service payant.

## Architecture et synchronisation

Une seule source produit : `apps/mobile/src/product`. React Native Web rend les composants partagés et les présentations spécifiques au desktop. `apps/web` fournit un point d’entrée de construction et de prévisualisation ; il ne duplique ni le domaine métier, ni l’authentification, ni les données.

Le mode connecté utilise le même Supabase de développement et les mêmes commandes `product-api` que l’iPhone : comptes, rôle, offres, lieux, disponibilités, cours collectifs, réservations, conversations, dossiers et décisions. Les mises à jour enregistrées sont rechargées périodiquement lorsque l’application est visible ; ce n’est pas une synchronisation instantanée de chaque frappe. Les brouillons et la navigation restent locaux. Les droits équipe viennent du serveur, jamais d’un choix dans la navigation.

Aucune migration ni modification serveur propre à cette livraison. Le domaine et les trois fonctions ont été livrés ensemble avec les dossiers adaptatifs dans la livraison 26. La WebApp ne transforme pas la recette serveur précédente en validation de chaque combinaison de navigateur et d’appareil.

## Présentation

- Dès 1 080 px : navigation latérale client/coach, badges Messages et Notifications séparés, accès au compte et à l’aide. Entrée éditoriale, Hanken, photographies locales, noir/blanc, surfaces arrondies et boutons pilules.
- Client : découverte en grille, filtres existants, comparaison, carte avec profil adjacent, profils, favoris, réservation et après-séance. Les formulaires restent de largeur lisible.
- Coach : agenda hebdomadaire à sept colonnes, navigation par semaine et journée, réservations individuelles, groupes, rendez-vous directs, occupations et indisponibilités. Les heures affichées viennent des réglages réels du coach ; aucune cadence n’est imposée par cette vue.
- Panneau journalier : offres, départs calculés par le domaine partagé, fermeture/réouverture d’un départ, accès au cours collectif correspondant. Modifier une date ouvre effectivement la date sélectionnée, sans changer la semaine habituelle.
- Réglages : vue d’ensemble en trois groupes, menu de rubriques à côté du formulaire, checklist de mise en ligne et accès à la mise en pause du profil. Toutes les configurations existantes restent accessibles.
- Messages : liste des personnes à gauche, conversation privée à droite, même brouillon et même accusé d’envoi qu’en mobile.
- Équipe : file de dossiers, recherche coach/pratique/secteur, catégories À examiner / À compléter / Traités / Tous, dix dossiers par page, priorité chronologique quand une date de dépôt existe. Détail documentaire, décisions par pratique et historique ; assistance accessible séparément. Aucun compte propriétaire n’a été habilité automatiquement.
- Sous 1 080 px : parcours mobile conservé ; tablette limitée à une largeur de lecture confortable. Le contenu actif est conservé lors d’un redimensionnement. Les simulations téléphone restent étroites et utilisent la navigation mobile.

Le mode démonstration reste explicitement fictif. En mode connecté, les anciennes limites de développement sont conservées, notamment le paiement non encaissé.

## Fichiers

- `apps/web/README.md` et `package.json` : commandes pour construire et prévisualiser sans publier.
- `scripts/build-webapp.mjs` : export Expo web de la source partagée dans `apps/web/dist`, ignoré par Git.
- `apps/mobile/public/web.html` : lanceur vers l’application, sans iframe. Connecté par défaut ; `?data=preview` pour la démo.
- `src/product/web/` : cadre desktop, entrée, réglages et file équipe.
- `src/product/web-agenda/` : vue hebdomadaire et projection sans mutation du Store.

## Recette exécutée

- TypeScript : aucun diagnostic.
- Export Expo web et iOS/Hermes : réussi. Le composant `PracticeReviewPanel` fait partie des sources et des bundles ; l’erreur de résolution signalée dans Xcode n’est plus reproduite à l’export. Aucun changement de pods ni de dépendance native dans cette livraison. Un build Xcode signé reste à refaire par le propriétaire.
- `test-webapp-27.cjs` : **45 contrôles dans Chromium**. Connexion demandée avant accès aux favoris d’un visiteur ; agenda, navigation hebdomadaire/date, fermeture/réouverture, rendez-vous direct, dix rubriques coach, messages envoyés, notifications, clients/activité, adaptation 390/820/1080/1440 px, grille client, profil/favoris/séances, réservation complète avec paiement simulé et persistance unique, file équipe de 23 dossiers/recherche/pagination/assistance. Aucune erreur JavaScript détectée.
- `agendaView.test.cjs` : **13 contrôles** de projection : heures irrégulières, groupe non dupliqué par participant, réservations conservées malgré fermeture d’une date, isolation coach, annulations, limites de semaine et absence de mutation.
- `test-verification-connected-web-26.cjs` en largeur 1440 : **6 contrôles** d’interface avec serveur simulé, délai, échec et reprise sans perte. Ce test n’est pas une transaction Supabase réelle.
- Régressions mobile DOM : **14 contrôles** du dossier adaptatif, **15** des réglages/enregistrements/déconnexion, **29** des sorties de navigation client. Les suites DOM ne prouvent pas le rendu iPhone.
- Captures revues : entrée, découverte, profil, confirmation, agenda, réglages, documents à 1080 et 1440, conversation et examen équipe. Aucun débordement horizontal de page dans les dimensions vérifiées ; la semaine utilise son propre défilement quand sept colonnes ne tiennent plus.

Les essais navigateur utilisent uniquement des données fictives dans un contexte Chromium isolé. Aucun compte, dossier réel ou habilitation n’a été créé pour cette recette.

## Limites et prochaine recette

- Revoir visuellement avec le propriétaire dans son navigateur, puis refaire le build sur son iPhone. Safari, Firefox et la navigation prolongée avec un compte réel doivent encore être vérifiés ; la recette Chromium ne les remplace pas.
- Le compte équipe réel doit être désigné puis habilité explicitement avant de traiter les futurs dossiers. L’interface ne réalise aucun contrôle réglementaire automatique.
- Les callbacks Apple/Google existants sur le port 8081 sont conservés. Un domaine ou un autre port public devra être autorisé avant publication. Aucun domaine n’est inventé ni acheté.
- Paiements/versements réels, SMTP personnalisé, SMS, Outlook, push navigateur, mode hors connexion et publication publique restent hors de cette livraison. Les push iOS conservent leur configuration et leur recette appareil restante.
- À grande échelle, la pagination actuelle organise l’affichage après chargement. Pagination serveur, recherche indexée et répartition des dossiers entre plusieurs examinateurs restent à ajouter au socle de données ; ne pas présenter la file comme une infrastructure de très grand volume déjà validée.
