# Partant — une marketplace qui fait aussi fonctionner l’activité du coach

> Historique de réflexion : les alertes, la préparation, l’assistance et les groupes ont depuis été ajoutés. La situation actuelle et les priorités sont décrites dans [la feuille de route](feuille-de-route-produit.md).

Évolution finalisée le 14 septembre 2026. Le nom **Partant** est conservé, sans flèche dans la marque. Les angles arrondis, les boutons pilule, le monochrome et Hanken Grotesk restent le langage commun des deux espaces.

## Mon avis sur le produit

La première version trouvait déjà le bon point d’équilibre entre une personne et un créneau. Cette combinaison constitue la proposition de valeur à préserver. Le danger serait maintenant d’ajouter beaucoup de fonctionnalités sans les relier à la promesse : trouver un accompagnement adapté et réserver sans négocier une heure par messages.

L’amélioration prioritaire était donc la cohérence du système : le coach doit comprendre ce qu’il publie, l’utilisateur doit comprendre ce qu’il achète, et un changement de réglage ne doit jamais réécrire un engagement déjà pris. La V2 renforce précisément ces trois points.

Le caractère premium vient de la clarté, du respect du contexte, de la prévisibilité des prix et de l’absence de mauvaises surprises. Il ne dépend pas d’un écran plus chargé ou d’animations supplémentaires.

## Benchmark complémentaire

Les pages publiques suivantes ont été consultées pour cette évolution. Il s’agit de documentations officielles, pas d’un audit complet des applications connectées.

| Référence | Enseignement utilisé | Traduction dans Partant |
|---|---|---|
| [Mindbody — prise de rendez-vous](https://www.mindbodyonline.com/en-gb/business/scheduling) | Le paramétrage des rendez-vous inclut le temps entre les prestations. | Durées explicites, pauses, temps tampon et contrôle des chevauchements. |
| [Trainerize — ressources produit](https://resources.trainerize.com/) | Types de séances, disponibilités, onboarding client et synchronisation d’agenda font partie du fonctionnement d’une activité de coaching. | Une configuration progressive précède la publication ; les séances se retrouvent ensuite dans l’agenda et les fiches clients. |
| [Trainerize — fonctionnalités](https://www.trainerize.com/features/) | L’accompagnement client et les opérations commerciales sont reliés dans un même outil. | Fiches clients, objectif partagé, notes privées, messages et activité financière dans des espaces distincts mais connectés. |
| [Fresha — disponibilité en ligne](https://www.fresha.com/help-center/knowledge-base/calendar/496-optimize-online-schedule-availability) | La disponibilité proposée résulte de règles de planning, pas simplement d’une liste d’heures saisies. | Résultats recalculés à partir de la durée, des plages de travail, des pauses, des absences et des réservations. |

Ces principes complètent le benchmark initial TrainMe, CoachUp, ClassPass, Playtomic, Fresha, Mindbody et Airbnb. L’architecture et l’identité restent propres à Partant. Aucune interface tierce n’a été copiée.

## Entrée et connexion

Un écran d’accueil distingue **« Je veux bouger »** et **« Je suis coach »**. Le même utilisateur peut ensuite passer d’un espace à l’autre.

La connexion utilise un parcours e-mail puis code. Dans le prototype, aucun message n’est envoyé et le code est toujours **123456**. Aucun mot de passe réel n’est demandé ni stocké. La création d’un espace coach ouvre sa checklist ; une connexion coach ouvre directement l’agenda de démonstration.

« Explorer d’abord » reste disponible : l’utilisateur peut comprendre l’offre avant de s’inscrire. En production, une identification minimale devra être finalisée avant un paiement, avec conservation du panier.

## Mini-onboarding client

Trois étapes, toutes contournables :

1. **Vos envies** : sport, objectif, niveau de pratique.
2. **Vos repères** : secteur, budget maximum par séance, distance.
3. **Votre moment** : lieu préféré et prochaine disponibilité.

Les réponses sont réutilisées immédiatement. Elles préremplissent les filtres et l’objectif de séance. Le tri « Selon mes envies » tient aussi compte de la correspondance entre l’objectif et les spécialités, puis de la proximité. Les autres tris restent accessibles.

L’utilisateur retrouve ses préférences dans Mon espace. Une recherche trop restrictive affiche un état vide explicite avec possibilité d’élargir ; aucune préférence n’est ignorée silencieusement. Le retour entre les étapes de l’onboarding fonctionne sans recommencer la connexion.

Je ne demanderais pas à ce stade le poids, des données médicales, une longue biographie ou des objectifs chiffrés. Ils augmenteraient la friction avant même que l’utilisateur ait trouvé quelqu’un. Le coach peut préparer la relation grâce à un objectif simple et au niveau de pratique.

## Espace coach : quatre usages

### Agenda

L’agenda montre les séances réservées, les disponibilités et les événements occupés. Une heure libre peut être fermée ou rouverte. Une réservation existante ne peut pas être écrasée par une indisponibilité.

Le coach peut consulter une séance, son lieu, sa durée, son tarif et l’objectif client. Une annulation coach exige une confirmation et un motif ; le client reçoit un remboursement intégral simulé, visible dans son historique. Les états « séance terminée » et « absence » sont accessibles comme outils de démonstration de l’après-séance.

### Clients

Recherche dans les clients fictifs, objectif, niveau, historique, notes privées et messagerie. Les notes privées ne sont pas affichées au client. Les réponses coach se retrouvent dans la conversation de la réservation active correspondante. Aucun message réel n’est envoyé.

### Activité

Montant des ventes, commission de 15 %, net prévisionnel et montant éligible après séance. Les remboursements sont déduits. Un relevé CSV peut être téléchargé et ouvert dans un tableur. Il s’agit d’un relevé de démonstration, pas d’une facture ou d’un document fiscal.

### Réglages

| Configuration | Action disponible | Effet dans le prototype |
|---|---|---|
| Profil | Nom public, discipline, méthode, expérience, qualifications, langues | Met à jour la fiche publique. Un changement d’identité ou de qualification remet la vérification en attente et suspend la publication. |
| Offres | Créer, modifier, activer ou mettre en pause une séance | Nom, individuel/duo, durée de 30/45/60/90 min, prix de 20 à 300 €. La première offre active sert d’entrée dans les résultats. |
| Lieux | Extérieur, studio, domicile, visio ; noms et adresses | Options proposées à la réservation. |
| Déplacement | Rayon et supplément domicile | Rayon expliqué ; frais ajoutés au total et détaillés avant paiement. La géographie reste simulée. |
| Semaine type | Jours travaillés, début/fin, pause quotidienne | Calcule des départs par pas de 30 min, avec respect de la durée de la séance. |
| Exceptions | Jours d’absence et événement occupé ponctuel | Retire les plages concernées de la réservation. |
| Règles | Temps tampon, délai minimum, horizon de 7 ou 14 jours | Filtre réellement les créneaux éligibles. |
| Annulation | Fenêtre de gratuité de 12/24/48 h | Règle conservée sur la réservation ; remboursement annoncé avant confirmation. |
| Documents | Parcours de vérification simulé | Contrôle séparé de la simple saisie du profil ; publication bloquée tant que la simulation n’est pas validée. |
| Coordonnées professionnelles | Nom d’activité, statut, e-mail, adresse fictifs | Configuration locale ; aucun identifiant bancaire ou administratif réel demandé. |
| Versements | Activation d’un compte de test | Étape nécessaire avant publication. Aucun paiement ou virement réel. |
| Notifications | Réservations, changements, rappels, actualités | Préférences locales, sans envoi externe. |
| Agendas externes | Explication de Google, Apple et Outlook ; événement occupé de test | L’événement simulé affecte le planning ; aucune synchronisation externe n’est revendiquée. |
| Publication | Mettre en pause ou réouvrir | Suspend les nouvelles ventes, conserve les rendez-vous confirmés. |

Les modifications non enregistrées dans une configuration sont signalées lorsqu’on tente de quitter l’écran.

## Mise en ligne accompagnée

Une création d’espace coach commence en brouillon. La checklist comporte six étapes : présentation, offre, lieux, planning, vérification et versements.

Le coach peut avancer dans l’ordre qui lui convient, retrouver ses réglages, puis publier une fois les étapes prêtes. Le bouton de publication n’est pas un simple changement visuel : sans offre active, lieu, vérification et versements de test, les créneaux ne sont pas proposés côté client.

La démo utilise toujours le coach fictif Thomas comme espace professionnel de référence. Elle ne crée pas un réseau de comptes ou de nouveaux professionnels réels.

## Points faciles à manquer, désormais pris en compte

- La durée fait partie du rendez-vous : elle détermine l’heure de fin, les conflits et l’événement calendrier.
- Un changement de durée au moment de choisir l’offre demande de resélectionner un créneau.
- Prix, durée, lieu et règle d’annulation sont conservés sur une réservation payée, même si le coach change ses réglages ensuite.
- Une offre modifiée pendant la préparation d’une réservation doit être revue avant confirmation.
- Deux séances client qui se chevauchent sont refusées.
- Un créneau ne traverse ni une pause ni la fin d’une plage de travail. Une semaine type trop courte pour accueillir une offre active est refusée avec une explication.
- Une indisponibilité ponctuelle qui chevauche une séance confirmée est refusée ; il faut traiter le rendez-vous existant.
- Fermer une journée ou mettre sa vitrine en pause ne supprime pas les séances confirmées.
- Une annulation coach n’utilise pas la pénalité d’annulation client : le remboursement est intégral.
- Les montants remboursés ne restent pas dans les revenus prévisionnels.
- Un justificatif affiché et une vérification ne sont pas la même chose.
- Les préférences client sont ajustables et ne remplacent pas la recherche libre.

## Ce que je différerais volontairement

**Packs et récurrence automatique** : il faut gérer le nombre de séances restantes, la disponibilité de chaque occurrence, les changements de tarif et les remboursements partiels. Le MVP permet déjà de réserver à nouveau avec un coach favori.

**Cours collectifs** : ils introduisent des places, une jauge, des annulations par participant et éventuellement un seuil de maintien. L’individuel et le duo constituent une première offre plus lisible.

**Programmation d’entraînement, nutrition et suivi biométrique** : ces fonctions feraient de Partant un logiciel d’entraînement complet. Elles ne sont pas nécessaires à sa proposition de marketplace locale réservable.

**Promotions, parrainage et abonnements professionnels** : à étudier après validation de l’offre locale, de la conversion et de la fidélisation. Ils ne doivent pas masquer une disponibilité insuffisante.

## Ce qui reste nécessaire en production

La complétude des écrans ne remplace pas une infrastructure réelle : authentification et séparation des accès, base de données, transactions sur les créneaux, prestataire de paiement marketplace, versements, remboursement effectif, facturation adaptée, contrôle professionnel, support et modération, notifications transactionnelles, stockage sécurisé, synchronisation d’agendas et géographie réelle.

Le temps tampon est ici fixe. Un vrai service devrait tenir compte du trajet entre deux lieux et vérifier la zone du domicile. Les règles commerciales et justificatifs devront être validés pour chaque marché ; les valeurs de la démo sont des hypothèses produit.

Les priorités de validation utilisateur seraient : temps nécessaire à la première réservation, compréhension du prix et du lieu, taux de résultat vide, temps de configuration coach, capacité du coach à prévoir quels créneaux seront visibles, et fréquence de nouvelle réservation après la première séance.

## Ajustement : objectifs contextualisés et secteurs franciliens

L’étape « Vos envies » propose trois intentions communes (forme, bien-être, découverte), puis trois objectifs liés à chaque pratique. Running : endurance, course, vitesse ; Pilates : muscles profonds, posture, mobilité ; yoga : souplesse, stress, approfondissement. Le changement de sport met les options à jour immédiatement. Un objectif commun est conservé ; un objectif devenu incompatible est remplacé avec une indication visible. Les choix sont conservés dans les préférences et réutilisés pour préparer la séance.

Le secteur utilise un sélecteur partagé par l’onboarding et l’exploration : recherche sans accents, par commune ou code postal, filtre parmi huit départements, correspondance exacte prioritaire, affichage progressif. Les 1 266 communes de la réponse officielle et les vingt arrondissements de Paris sont intégrés au HTML. Aucun appel réseau n’est nécessaire à l’usage. Le budget et les autres réponses restent conservés lors de la sélection.

Source : [API Découpage administratif — Communes](https://geo.api.gouv.fr/decoupage-administratif/communes), extraction du 14 septembre 2026, filtre codeRegion=11, champs nom/code/codeDepartement/codesPostaux. Les arrondissements parisiens sont ajoutés séparément.

La couverture du sélecteur ne signifie pas une offre fictive dans chaque commune : les coachs sont toujours parisiens. Un état sans offre locale le précise et propose de rechercher en visio. Les distances restent indicatives.
