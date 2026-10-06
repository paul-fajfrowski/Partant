# Recette terrain — version 38

Objectif : vérifier les échanges réels entre un client iPhone et un coach WebApp, puis observer leur compréhension sans leur expliquer l’interface. Ne pas confondre une simulation locale avec cette recette.

## Préparation

- Recompiler le workspace courant `apps/mobile/ios/Partant.xcworkspace` ; un ancien binaire ne reçoit pas les modifications de source automatiquement.
- Deux comptes de test distincts, un client et un coach, en mode connecté. Les paiements demeurent simulés ; aucun encaissement réel attendu.
- Un opérateur équipe explicitement désigné par Paul, doté du rôle requis et de MFA, pour instruire le dossier. Ne jamais promouvoir automatiquement le coach ni contourner ses justificatifs.
- Quelques offres, lieux et heures réalistes dans un même secteur. Ne pas utiliser les fixtures de démonstration comme des comptes connectés.
- Consigner version/commit, appareil, OS, navigateur, date, scénario, résultat attendu/obtenu et capture éventuelle sans secrets.

## Parcours à exécuter

| Scénario | Résultat attendu |
| --- | --- |
| Nouveau coach | Dossier en premier ; pièces communes réutilisables ; état envoyé/attente distinct d’une correction. Aucun profil publiable avant validation. |
| Décision équipe | Attribution et contrôle MFA ; correction visible chez le coach ; nouvelle soumission puis décision motivée. Pas d’accès à un dossier non autorisé. |
| Première offre | Discipline, durée, tarif, format et lieu cohérents. Les options groupe apparaissent seulement pour ce format. |
| Ouverture datée | Une date ponctuelle sans semaine récurrente suffit si un départ est réservable ; checklist et bouton publication concordent. |
| Recherche client | Coach disponible demain trouvé par son nom ; sport filtré = offre proposée ; date choisie sans résultat propose clairement des alternatives. |
| Prix | Domicile avec supplément exclu d’un budget trop bas ; total identique au récapitulatif. Duo = deux personnes ; groupe = prix × places. |
| Réservation | Client réserve ; rendez-vous et disponibilité mis à jour côté coach après serveur, avec notification. Répéter un clic ou reprendre le réseau ne crée pas de doublon. |
| Dernière place | Deux clients tentent le même créneau individuel ou la dernière place de groupe ; une seule réservation admise, autre client informé. |
| Agenda extérieur | Ajouter un rendez-vous hors Partant ou une indisponibilité ; le créneau n’est plus proposé. Retirer l’indisponibilité ne supprime pas une réservation existante. |
| Modification/annulation | Respect des règles et décisions des deux parties ; historique et places actualisés. Une notification lue n’efface pas une action encore requise. |
| Messagerie | Une conversation par personne ; aucun accès à une séance tierce ; brouillon et renvoi fiables si réseau interrompu. |
| Navigation | Jour → semaine → réglages ; dialogue → écran ; lien profil, rechargement et Retour/Avancer web ; lien natif avec app fermée puis ouverte. |
| Connexion | Apple/Google et e-mail réel, abandon/reprise, déconnexion puis retour navigateur. Lien e-mail standard tant que SMTP/code non activé. |
| Push | Autorisation/refus, premier plan, arrière-plan et application fermée. Toucher l’alerte ouvre la bonne destination du bon compte. |
| Calendar | Consentement distinct de la connexion ; occupation externe, modification, révocation/reconnexion. Vérifier qu’une occupation bloque réellement la réservation. |
| Ergonomie iPhone | Clavier, grandes polices, VoiceOver, scroll, champs, fermeture des dialogues ; importer une photo réelle et un justificatif réel de test. |
| Retour client | Séance à venir accessible dès l’accueil ; retrouver un coach après une séance, sans hériter d’anciens filtres restrictifs. |

## Observation après la recette technique

Faire essayer la première réservation et la première configuration coach à quelques personnes qui n’ont pas conçu le produit. Noter les étapes où elles hésitent, les erreurs, la durée et l’aide demandée. Une petite série identifie des frictions ; elle ne démontre pas une adoption à grande échelle.

Concentrer le pilote sur un secteur et quelques disciplines avec des créneaux réellement tenus. Observer réservations abouties, retours des clients, disponibilité régulièrement mise à jour et temps gagné par les coachs. Aucun outil de tracking ni collecte supplémentaire activé dans cette livraison ; définir les finalités et données avant instrumentation.

Sortie de recette : défauts bloquants corrigés et rejoués ; limites restantes documentées ; paiements et services reportés traités dans leur propre étape avant exploitation commerciale. Ne pas publier « tout fonctionne » sur la seule base du bundle ou des tests navigateur.
