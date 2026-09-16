# Partant — périmètre du MVP et reste à faire

> Mise à jour React Native : le développement produit continue désormais dans `apps/mobile`. Ce document décrit le périmètre issu du HTML ; consulter [la couverture native et les limites du mode connecté](../docs/parite-prototype-react-native.md) pour l’état actuel.

État au **16 septembre 2026**, après les priorités 1 et 2, le correctif notifications et la finalisation A1–A9. Voir `finalisation-prototype.md` pour les parcours ajoutés et les limites de validation.

## Mise à jour architecture et branchements

Cible confirmée : **React Native + TypeScript + Expo**, directement, sans étape Swift. Le prototype A1–A9 est validé visuellement. Les premières fondations Supabase sont déployées et un parcours React Native connecté est créé, mais les étapes 1–3 ne sont pas terminées. Consulter `../docs/branchements.md` pour les états vérifiés, les prérequis développeur et les limites. Paiement et communications externes restent reportés.

## Où nous en sommes

**Le MVP d’expérience est déjà largement testable. Le MVP commercial reste à construire.**

Aujourd’hui, une personne peut découvrir un coach, comparer les offres, sélectionner une disponibilité, simuler le paiement, retrouver sa séance, échanger avec le coach, modifier sa réservation, publier un avis et réserver à nouveau. Le coach peut configurer son offre, son planning, ses groupes et suivre ses clients.

Ces parcours utilisent des données locales dans un navigateur. La présence d’un écran de paiement, d’un badge vérifié ou d’un sélecteur de comptes ne signifie pas que le service correspondant est connecté.

Pas de pourcentage global de complétion : un grand nombre d’écrans aboutis ne permet pas de mesurer le travail restant sur les paiements, les disponibilités partagées et l’exploitation.

**Légende**

- **Testable** : une interaction fonctionne et modifie les données de la démo.
- **Partiel** : un parcours existe, mais une limite réduit son usage.
- **Simulé** : l’interface illustre un service qui n’est pas connecté.
- **Absent** : pas de parcours dédié implémenté.

Même une fonctionnalité « testable » devra être reliée à des services persistants et sécurisés pour fonctionner avec de vrais utilisateurs.

## 1. Côté particulier : ce que nous possédons

| Fonctionnalité | État | Ce qui fonctionne / limite principale |
|---|---|---|
| Accueil particulier / coach | Testable | Entrées distinctes et exploration sans inscription. |
| Inscription et connexion | Simulé | Comptes fictifs distincts, code fixe 123456 ; reprise de la sélection avant paiement, aucun e-mail envoyé. |
| Mini-onboarding | Testable | Sport, objectifs adaptés à la pratique, niveau, budget, secteur, distance et moment préféré. Étapes contournables. |
| Préférences modifiables | Testable | Réutilisées dans la recherche et l’objectif de séance. |
| Secteurs d’Île-de-France | Partiel | Communes, départements, arrondissements et recherche par code postal ; l’offre fictive demeure parisienne. |
| Recherche coach / sport / quartier | Testable | Résultats filtrés, tri et récupération après une recherche sans résultat. |
| Recherche par disponibilité | Testable | Aujourd’hui, soir, lendemain, date et heure ; calendrier glissant et heure de Paris. |
| Budget, distance, lieu, format | Testable | Individuel / duo / groupe, extérieur / studio / domicile / visio. Distance schématique. |
| Carte | Simulé | Vue de découverte utilisable, positions et distances fictives ; aucun itinéraire ou géocodage réel. |
| Cartes coachs avec créneaux | Testable | Prix, discipline, avis, lieu et disponibilité directement visibles. |
| Comparaison de coachs | Testable | Comparatif d’options depuis les résultats. |
| Profil détaillé | Testable | Photo, présentation, méthode, spécialités, expérience, langues, lieux, offres et créneaux. |
| Signaux de confiance | Simulé | Badges, diplômes et données de démonstration ; aucun contrôle documentaire réel. |
| Favoris | Testable | Conservés par compte fictif. |
| Réservation individuel / duo | Testable | Offre, durée, date, heure, lieu, objectif et prix final. |
| Réservation de groupe | Testable | Prix par personne, maximum, places restantes, achat de plusieurs places. |
| Paiement | Simulé | Attente, validation, refus, interruption, expiration et nouvelle tentative ; aucun débit ni authentification bancaire. |
| Confirmation et détail | Testable | Date, lieu, prix, consignes et actions après réservation. |
| Export calendrier | Testable | Fichier .ics téléchargeable ; les changements ultérieurs ne mettent pas automatiquement à jour l’événement importé. |
| Séances futures / passées | Testable | Historique propre à chaque compte, états confirmée / terminée / annulée / absence. |
| Modification individuel / duo | Testable | Changement de créneau avec contrôle des conflits et notification au coach. |
| Annulation et remboursement | Testable | Application locale des conditions, montant annoncé avant confirmation ; remboursement bancaire simulé. |
| Transfert de cours collectif | Testable | Toutes les places vers un cours du même coach, avant la limite prévue, avec supplément ou remboursement. |
| Annulation partielle d’un groupe | Testable | Nombre de places à garder, remboursement selon les conditions et libération de capacité. |
| Réserver à nouveau | Testable | Jusqu’à trois propositions compatibles, tarif actuel et confirmation séparée de chaque séance. |
| Préparation de la séance | Testable | Matériel, accès, consignes, météo prévue par le coach et mémo personnel. |
| Messagerie | Testable | Conversation par réservation, réponses partagées, lus / non lus ; échanges limités au navigateur. |
| Notifications internes | Testable | Réservations, reports, annulations, changements de places et transferts ; historique et compteurs. |
| Alertes de disponibilité | Partiel | Recherche enregistrée et correspondances recalculées à l’ouverture, notifications internes et places souhaitées prises en compte ; aucun envoi externe ni file d’attente ordonnée. |
| Avis et réponses | Testable | Avis après séance terminée, note recalculée, réponse du coach, signalement. |
| Assistance | Testable | Dossier lié à une séance, motif, réponse et décision de remboursement simulée. |

## 2. Côté coach : ce que nous possédons

| Fonctionnalité | État | Ce qui fonctionne / limite principale |
|---|---|---|
| Création d’un compte coach | Testable | Profil indépendant en brouillon et checklist de mise en ligne ; identité fictive. |
| Profil public personnalisable | Testable | Portrait de galerie ou import, textes, spécialités, langues, expérience et qualifications saisies. |
| Prévisualisation client | Testable | Offre réservable ou explication du blocage de publication. |
| Création d’offres | Testable | Individuel, duo, groupe ; nom, durée, prix, activation et pause. |
| Capacité des groupes | Testable | Maximum choisi entre 2 et 20 dans la démo ; impossible de descendre sous les places déjà réservées. |
| Planification des cours | Testable | Cours datés, prix et conditions conservés ; durée bloquée dans l’agenda. |
| Gestion des inscrits | Testable | Compte réservant et nombre de places ; pas d’identité séparée de chaque accompagnant. |
| Lieux et déplacements | Partiel | Parc, studio, domicile, visio, rayon et supplément ; pas de contrôle géographique effectif. |
| Semaine type | Testable | Jusqu’à trois plages par jour, journées fermées et exceptions datées. Réservations existantes conservées. |
| Absences et indisponibilités | Testable | Fermeture/réouverture et événement occupé, sans écraser une réservation existante. |
| Délais de réservation | Testable | Temps tampon, délai minimum, horizon de 7, 14, 30, 60 ou 90 jours et conditions d’annulation. |
| Agenda | Testable | Séances, groupes, créneaux ouverts et plages occupées. |
| Annulation coach | Testable | Motif, annulation et remboursement intégral simulé du solde, client prévenu. |
| Annulation de tout un cours | Testable | Toutes les réservations concernées sont clôturées et remboursées dans la démo. |
| Dossiers clients | Testable | Objectif, niveau, séances, conversations et notes privées dans le parcours coach. |
| Consignes | Testable | Consignes des prochaines séances ; les réservations existantes gardent leur version. |
| Messagerie / notifications | Testable | Échanges, compteurs et événements propres au coach connecté. |
| Activité et commission | Testable | Paiements cumulés, remboursements, net prévisionnel et commission fictive de 15 %. |
| Export d’activité | Testable | CSV utilisable ; ce n’est pas une facture ni un relevé bancaire. |
| Versements | Simulé | Activation d’un compte de test et aperçu des montants ; aucun virement. |
| Vérification du coach | Simulé | Dossier fictif, examen équipe, correction/refus, validation et expiration ; pas de pièces réellement examinées. |
| Connexion d’agendas externes | Simulé | Google / Apple / Outlook présentés, événement occupé de test ; aucune synchronisation. |
| Publication / pause | Testable | Nouvelles ventes suspendues sans supprimer les réservations confirmées. |

## 3. Équipe Partant et socle technique

| Fonctionnalité | État | Limite |
|---|---|---|
| Traitement de demandes d’assistance | Testable | Réponse, remboursement du solde et trace de décision dans l’espace équipe fictif. |
| Modération des avis et profils | Testable | Signalement, examen, masquage d’avis ou pause de profil. |
| Comptes et rôles | Partiel | Les parcours séparent les données ; le sélecteur de démo permet volontairement d’ouvrir tous les comptes. Aucune autorisation serveur. |
| Persistance | Partiel | Stockage local ; pas de base partagée ni de synchronisation entre appareils ou onglets. |
| Disponibilités et capacité | Partiel | Contrôles cohérents dans la démo ; aucun verrou transactionnel entre acheteurs réels. |
| Interface responsive | Testable | Mobile, tablette et desktop ; HTML autonome, images et police intégrées. |
| Accessibilité | Partiel | Éléments natifs, libellés, focus et modales ; pas d’audit complet avec lecteurs d’écran. |
| Tests | Partiel | Suites de logique/rendu et scénarios navigateur documentés ; pas de validation d’une infrastructure réelle. |
| Administration opérationnelle complète | Absent | Pas de gestion complète des droits équipe, dossiers documentaires, versements, incidents et recherches transversales. |
| Hébergement applicatif / supervision | Absent | Fichier HTML et aperçu local ; pas de service de production exploité. |

## 4. Finalisation du prototype A1–A9 : livrée localement

Les neuf lots précédemment proposés disposent maintenant d’un parcours testable. Le détail, les scénarios et les limites sont dans **finalisation-prototype.md**.

| Lot | Livré dans le prototype | Raccordement restant pour le MVP |
|---|---|---|
| A1 | Connexion avant paiement et reprise de la sélection | Authentification réelle, panier rattaché à une session serveur. |
| A2 | Modes Présentation / Test | Autorisations serveur client, coach et équipe. |
| A3 | Calendrier glissant, heure de Paris, états temporels et ICS | Source de temps serveur et traitements planifiés. |
| A4 | Plusieurs plages par jour et exceptions | Stockage partagé, contrôle serveur et éventuelle synchronisation externe. |
| A5 | Attente, refus, interruption, expiration, reprise, perte de disponibilité, suivi des remboursements | Prestataire de paiement, transactions, expiration des réservations temporaires et événements bancaires. |
| A6 | Coordonnées, aide connexion, déconnexion, export et suppression locale | Vérification des coordonnées, authentification, conservation et suppression côté serveur. |
| A7 | Dossier fictif examiné par l’équipe, correction/refus, validation et expiration | Téléversement protégé, personnel habilité et contrôles réels. |
| A8 | Proposition coach et accord/refus client, y compris transfert d’une réservation de groupe | Notification réelle et acceptation transactionnelle. |
| A9 | Rappels et alertes internes tenant compte des places et préférences | Exécution en arrière-plan, canaux externes et suivi des échecs. |

**478 vérifications passent** : 337 contrôles existants, 117 nouveaux contrôles de logique et 24 contrôles de formulaires/navigation dans jsdom. L’audit visuel mobile, l’accessibilité et les services externes restent à vérifier. Une fonctionnalité testable localement ne devient pas pour autant prête pour la production.

## 5. Ce qui manque pour un MVP avec de vrais utilisateurs

Ce chantier est distinct de l’ajout d’écrans. Les éléments « testables » ci-dessus devront aussi y être raccordés.

| Lot | Travail | Résultat attendu pour le pilote |
|---|---|---|
| B1 — Données et accès | Serveur, base de données, authentification réelle, sessions, autorisations client/coach/équipe, stockage des photos et pièces. | Les données restent accessibles sur plusieurs appareils ; chacun ne consulte et ne modifie que ce qui lui appartient. |
| B2 — Réservation fiable | Dates et fuseaux réels, validation serveur des offres et conditions, protection contre les doubles achats, expiration d’une tentative de paiement. | Deux personnes ne peuvent pas acheter la dernière place ; une action rejouée ne crée pas de second débit ou réservation. |
| B3 — Paiement marketplace | Encaissement, commission, compte coach, remboursements partiels, versements, événements de paiement et rapprochement des montants. | Chaque réservation est reliée à ses mouvements réels et aux états affichés. Définir aussi les justificatifs de paiement à fournir. |
| B4 — Messages et envois | Messagerie entre appareils, délivrance, notifications, rappels, choix des canaux, suivi des échecs. | Le bon destinataire reçoit l’information même s’il n’est pas dans l’application. Les messages privés restent protégés. |
| B5 — Localisation et planning externe | Adresses vérifiées, coordonnées, distances/rayon, carte et stratégie de synchronisation d’agenda. | Un coach n’est pas proposé hors de sa zone ; ses occupations extérieures ne deviennent pas des créneaux vendables. |
| B6 — Confiance et exploitation | Examen réel des coachs, équipe habilitée, assistance, modération, gestion des incidents, documents et règles du service à définir pour le périmètre choisi. | Chaque badge et chaque remboursement correspondent à une action traçable. Le support peut expliquer et résoudre un problème. |
| B7 — Qualité et mesure | Hébergement, sauvegarde/restauration, suivi des erreurs, tests de paiement et de concurrence, accessibilité, mesure du parcours. | Les erreurs sont détectées ; on sait mesurer recherche sans résultat, conversion, réservations répétées et annulations. |
| B8 — Offre de départ | Recruter et accompagner les premiers coachs, obtenir de vraies plages ouvertes, choisir un territoire et quelques disciplines. | Les recherches représentatives des premiers clients trouvent effectivement des séances. |

Décision du 16 septembre : commencer directement en React Native, connecter la découverte locale et préparer Google Calendar puis Outlook avant le paiement. Les agendas ne sont pas encore synchronisés ; le coach doit tenir son planning Partant à jour tant que les connexions ne sont pas actives.

## 6. Fonctionnalités absentes que je garderais pour plus tard

| Fonctionnalité | Position proposée |
|---|---|
| Réservations client récurrentes automatiques | Après validation du retour client ; traiter prix, exceptions et consentement avant automatisation. |
| Planification récurrente des cours coach | Utile pour gagner du temps, mais les cours datés peuvent suffire au premier pilote. |
| Packs, crédits et abonnements | Reporter ; ajoutent validité, consommation et règles de remboursement. |
| File d’attente ordonnée pour un groupe complet | Reporter ; distinguer une vraie file avec proposition temporaire d’une simple alerte de disponibilité. |
| Minimum de participants et annulation automatique d’un cours | Reporter ; actuellement le cours est maintenu dès la première inscription. |
| Paiement séparé par chaque accompagnant | Reporter ; une personne réserve et paie toutes les places. |
| Fiches individuelles des accompagnants | Reporter sauf besoin identifié pour le périmètre du pilote ; définir séparément le cas des mineurs. |
| Transfert entre coachs ou de seulement certaines places | Reporter ; la version actuelle transfère toutes les places d’une réservation au sein du même coach. |
| Gestion de plusieurs studios, équipes ou ressources | Reporter ; l’outil est centré sur un coach indépendant. |
| Multi-villes avec offre réelle | Étendre après validation locale ; un sélecteur géographique seul ne crée pas de disponibilité. |
| Lien public partageable et attribution des nouveaux clients | Évolution utile pour l’acquisition et l’activité coach. |
| Statistiques avancées et prévisions de revenus | Reporter ; suivre d’abord les réservations, remboursements et indicateurs essentiels. |
| Codes promotionnels, parrainage, cartes cadeaux | Reporter jusqu’à compréhension de la conversion et du retour client. |
| Visio intégrée | Le format est sélectionnable ; un véritable lien externe peut suffire avant un outil intégré. |
| Applications iOS / Android | Décision confirmée : React Native + Expo dès maintenant. Le HTML reste la référence ; les écrans natifs sont à intégrer progressivement, sans publication pour le moment. |
| Fil social, défis, nutrition, objets connectés | Hors cœur du MVP de réservation. |

## 7. Définition proposée du MVP commercial

Une marketplace locale qui permet à un client identifié de réserver et payer une séance individuelle, duo ou collective auprès d’un coach vérifié, puis de retrouver son rendez-vous, communiquer, modifier ou annuler selon des règles claires et réserver à nouveau.

Le coach configure ses offres et disponibilités, reçoit les réservations et changements, connaît les montants qui lui reviennent et dispose d’une assistance. L’équipe Partant peut contrôler les profils et résoudre un incident.

Le pilote peut être limité à quelques disciplines et secteurs, avec une exploitation en partie manuelle. Il doit cependant avoir de vraies identités, de vraies disponibilités, des paiements traçables et un interlocuteur capable de traiter les problèmes.

## Sources locales de cet inventaire

- **partant.html** : comportement implémenté.
- **priorite-1.md** : comptes, échanges, profils, avis et notifications.
- **priorite-2.md** : retour, transferts et annulations partielles.
- **verification.md** : tests et limites de validation.
- **feuille-de-route-produit.md** : décisions produit et évolutions envisagées.

Les lots A sont désormais implémentés dans le prototype local. Les lots B restent le chantier du MVP réel, sans estimation de durée. Les règles commerciales et le périmètre opérationnel doivent être arrêtés avant la mise en service.
