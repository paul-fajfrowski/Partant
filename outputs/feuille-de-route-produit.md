# Partant — priorités produit et version enrichie

Mise à jour du 16 septembre 2026. Cette feuille de route distingue le prototype livré, les conditions d’un lancement réel et les développements suivants. Les priorités expriment un ordre de travail, pas une promesse de calendrier.

La **priorité 1 du prototype** est maintenant livrée : comptes distincts, conversations partagées, avis et réponses, recherche par format et profils coachs personnalisables. Le périmètre exact et le scénario de recette sont dans **priorite-1.md**. Les niveaux P0/P1 ci-dessous concernent la feuille de route générale du produit et du lancement.

## La décision produit

Partant doit réussir trois moments : trouver une disponibilité pertinente, vivre une séance bien préparée et retrouver facilement son coach. L’individuel, le duo et le groupe partagent cette promesse, mais leurs règles de réservation diffèrent.

La découverte reste libre et l’onboarding court. Les réglages détaillés restent dans l’espace coach. L’administration apparaît séparément comme un outil de démonstration de l’équipe Partant.

## Ce qui est maintenant dans le prototype

| Parcours | Comportement livré | Limite actuelle |
|---|---|---|
| Alertes | Enregistrer une recherche ou suivre un coach ; jour et plage horaire ; correspondances individuelles, duo et groupe ; pause, suppression et accès à la réservation | Recalcul à l’ouverture de la page, sans notification externe ni réservation automatique. Le prix d’une alerte groupe est par personne. |
| Préparation | Consignes de matériel, accès et météo ; mémo personnel ; contact coach | Consignes conservées avec les nouvelles réservations ou le cours planifié ; aucun service météo réel. |
| Configuration des consignes | Le coach modifie les informations pour ses prochaines séances | Les séances déjà confirmées gardent leurs consignes. |
| Assistance client | Demande liée à une séance, motif et explication ; suivi de réponse | Aucun service d’assistance réel contacté. Une demande seule ne modifie pas la réservation. |
| Équipe Partant | Examiner la demande, voir le montant déjà remboursé, répondre ou rembourser le solde ; historique de décision | Premier espace centré sur l’assistance. Accès libre de démonstration, sans séparation des droits de production. |
| Groupes | Offre activable par le coach, capacité, niveau et prix par personne ; cours datés ; inscriptions ; annulations | Cours maintenu dès une inscription. Pas de seuil minimum, de cours récurrents automatiques ou de déplacement collectif à domicile. |

## Les cours en groupe, concrètement

Le coach crée une offre **Groupe** dans « Réglages → Séances & tarifs ». Il choisit le nom, la durée, le prix par personne, le maximum de participants, le niveau et un lieu compatible : extérieur, studio ou visio. La démo autorise un maximum entre 2 et 20 et un prix entre 5 et 300 € par personne ; ce sont des paramètres de prototype, pas des règles universelles du produit.

Il planifie ensuite chaque cours à une date et une heure. Cela réserve son temps dans l’agenda, même si personne n’est encore inscrit. Le système refuse les chevauchements avec une séance, un autre cours ou une indisponibilité et respecte les horaires et pauses configurés.

Le cours apparaît sur le profil du coach et dans la recherche lorsque le jour, l’heure et les autres critères correspondent. Le client voit le lieu fixe, la durée, le niveau, le prix par personne, le maximum et les places restantes. Il peut réserver pour lui et ses accompagnants avec un seul contact de réservation. Le nombre de participants multiplie le prix avant le paiement simulé.

Exemple vérifié : **6 places à 20 € par personne → réservation de 3 places → total de 60 € → 3 places restantes**.

Les règles importantes :

- Les places sont revérifiées à la confirmation. Un achat en cours ne constitue pas une garantie de place.
- Une réservation client ne peut pas chevaucher une autre séance du même client.
- Le maximum d’un cours peut être ajusté, mais jamais sous le nombre de places déjà réservées.
- Modifier le tarif ou la capacité de l’offre ne réécrit pas les cours déjà planifiés. Le coach ajuste séparément la capacité d’un cours existant.
- Mettre une offre en pause bloque les nouvelles inscriptions, sans effacer les réservations confirmées.
- Annuler une réservation libère ses places ; le cours reste planifié. Le remboursement suit les conditions de cette réservation.
- Annuler le cours entier rembourse intégralement toutes ses réservations et libère l’agenda du coach.
- Un cours complet peut faire l’objet d’une alerte. Les inscriptions des autres clients restent une simulation locale ; les transactions concurrentes exigent un backend réel.

Depuis la priorité 2, le client peut transférer toutes ses places vers un cours compatible du même coach avant la limite d’annulation gratuite, avec ajustement du prix. Il peut aussi annuler certaines places et conserver les autres. Les montants et les notifications sont reliés ; voir **priorite-2.md**.

## P0 — avant d’ouvrir à de vrais paiements

| Priorité | Travail à réaliser | Condition de passage |
|---|---|---|
| Disponibilité et places fiables | Base de données, transaction atomique pour créneau/capacité, verrou temporaire de paiement, libération sur échec, synchronisation d’agendas | Deux clients ne peuvent pas acheter la dernière place ; un événement occupé ne reste pas vendable. |
| Paiement et versement de bout en bout | Prestataire marketplace, échecs et statuts intermédiaires, remboursements effectifs, pièces et rapprochement des montants | Chaque somme peut être reliée à une réservation, un remboursement ou un versement. |
| Accès et confiance | Authentification, séparation client/coach/équipe, contrôle effectif des justificatifs, expiration, confidentialité des adresses et notes, gestion des demandes sur les données | Un badge représente un contrôle traçable ; chacun ne voit que les informations nécessaires à son rôle. |
| Exploitation | Assistance réelle, modération, signalements et litiges, responsabilités de traitement, suivi des décisions | Une personne peut prendre en charge chaque incident et en expliquer la résolution au client et au coach. |
| Cadre de lancement | Définir avec les intervenants compétents les règles du marché, conditions commerciales, accompagnement des mineurs, responsabilités et documents | Le périmètre annoncé aux utilisateurs correspond au service réellement fourni. |
| Offre locale suffisante | Ouvrir quelques secteurs et disciplines avec des coachs et des horaires disponibles | Les recherches représentatives des premiers utilisateurs trouvent des options crédibles. |

L’administration actuelle illustre un flux de résolution ; elle ne suffit pas à couvrir ces opérations de production.

## P1 — valider les ajouts avec clients et coachs

Les alertes, les consignes, les groupes et l’assistance sont maintenant testables. Je ferais tester cinq situations :

1. Une personne cherche mardi à 19 h, ne trouve pas, enregistre une alerte puis réserve une correspondance.
2. Un coach crée une offre de groupe, ouvre un cours et prédit correctement ce qui sera visible côté client.
3. Un client réserve pour trois personnes et explique le total et les règles d’annulation sans aide.
4. Un coach réduit la capacité ou annule un cours ; les inscriptions et les montants restent compréhensibles.
5. Un client rencontre un problème, trouve l’assistance et retrouve la décision ensuite.

Observer la réussite et les hésitations, pas seulement les opinions. Mesurer notamment le temps pour la première réservation, la compréhension du prix par personne, le temps de mise en ligne d’un cours, la part de recherches sans résultat et les demandes d’aide par réservation.

## P2 — faciliter le retour après validation

Les trois premiers parcours de retour sont maintenant livrés dans le prototype : propositions de prochains créneaux, transfert de toutes les places vers un autre cours du même coach et annulation partielle des places. Voir **priorite-2.md**. Les packs et l’analyse avancée d’activité ci-dessous restent des évolutions futures.

**Garder le rythme.** Proposer après une séance deux ou trois prochains rendez-vous, chacun avec une disponibilité, un prix et un consentement explicites. Prévoir les exceptions et les changements de tarif avant toute récurrence automatique.

**Déplacer des places.** Transférer une réservation vers un autre cours et gérer une annulation partielle des accompagnants, avec présentation de la différence de prix et du remboursement.

**Packs.** Les envisager lorsque les clients reviennent : nombre de séances restantes, validité, services éligibles et remboursement des crédits doivent être définis ensemble.

**Activité du coach.** Distinguer nouveaux clients apportés par Partant et clients invités via son lien, montrer les créneaux recherchés mais absents et faciliter la remise en ligne de cours qui fonctionnent.

## Ce que je n’ajouterais pas encore

Fil social, classements, défis, nutrition, objets connectés et programmation complète d’entraînement. Le produit gagne d’abord à mieux faire fonctionner la rencontre locale et la réservation suivante.

Le principal risque produit demeure une recherche sans offre pertinente. Une grande liste de communes ne remplace pas des coachs réellement disponibles. Le second risque est le départ hors plateforme après la première séance : les rendez-vous suivants doivent apporter une utilité visible au client et au coach — disponibilité fiable, reports simples, documents et assistance.

## Sources et principes retenus

Les listes d’attente de [Fresha](https://www.fresha.com/help-center/knowledge-base/calendar/259-set-up-and-manage-your-waitlist) éclairent l’intérêt de conserver une intention lorsqu’aucun créneau ne convient. Pour Partant, l’alerte garde aussi le besoin temporel et local.

Le [processus de contrôle décrit par CoachUp](https://support.coachup.com/hc/en-us/articles/203652577-How-does-CoachUp-ensure-the-quality-of-its-coaches) rappelle qu’un signe de confiance doit correspondre à une opération réelle. Le périmètre à appliquer à Partant devra être adapté à son marché.

Le benchmark initial et ses autres références restent dans `benchmark-et-conception.md`. Ces principes alimentent le produit ; l’identité monochrome, la photographie, les arrondis et la typographie de Partant sont conservés.
