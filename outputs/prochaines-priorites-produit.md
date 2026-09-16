# Partant — ce qui rendrait le produit complet

> Historique de réflexion : les alertes, la préparation, l’assistance et les groupes ont depuis été ajoutés. La situation actuelle et les priorités sont décrites dans [la feuille de route](feuille-de-route-produit.md).

Réflexion produit du 14 septembre 2026. Les éléments ci-dessous sont des recommandations, pas des fonctionnalités ajoutées au prototype dans cette itération. Seuls les pictogrammes sportifs ont été affinés.

## Mon avis

Le prototype fait comprendre la rencontre entre un coach, un lieu et un moment disponible. La photographie donne une place à la personne ; le monochrome et les formes arrondies donnent de la cohérence aux espaces client et coach. L’onboarding contextualisé aide à démarrer sans exiger un long dossier.

Ce résultat visuel ne prouve toutefois pas encore que des clients réserveront, reviendront et resteront sur la plateforme. La prochaine étape est de tester la compréhension du prix, la pertinence des résultats, la confiance dans le coach et le temps nécessaire pour configurer une offre réellement réservable.

## Avant de faire payer de vrais clients

| Priorité | À définir ou réaliser | Pourquoi cela compte |
|---|---|---|
| Une disponibilité fiable | Synchronisation des agendas, réservation atomique du créneau, blocage temporaire pendant le paiement, libération si échec, fuseaux horaires, temps de trajet entre lieux | Une disponibilité affichée doit pouvoir être tenue. Un simple temps tampon identique partout ne suffit pas pour un coach mobile. |
| Le paiement jusqu’au versement | Paiement échoué ou en attente, remboursements partiels et totaux, historique, pièces justificatives, versement échoué, rapprochement des montants | Le coach doit savoir ce qui est réservé, gagné, remboursé et effectivement versé. |
| Une rencontre bien préparée | Matériel fourni, équipement à apporter, accès au lieu, point de rendez-vous, nombre de participants, consigne si retard, solution météo | Une réservation réussie ne garantit pas que les deux personnes se retrouvent sans friction. |
| Des imprévus compréhensibles | Coach absent, client absent, demande de report, lieu fermé, météo, séance contestée | Chaque cas doit annoncer le prochain choix, le montant concerné et la manière de joindre l’assistance. |
| Une équipe Partant outillée | Espace d’administration : dossiers coachs, justificatifs et dates d’expiration, litiges, remboursements, signalements, avis contestés, suivi des actions | Il existe un troisième utilisateur : l’équipe qui fait fonctionner la marketplace. Son travail ne doit pas dépendre de modifications manuelles de la base de données. |
| Des accès et des données maîtrisés | Comptes distincts, récupération d’accès, préférences de contact, suppression/export, visibilité des adresses, séparation des notes privées et des informations client | Le stockage local et la bascule de rôle du prototype ne représentent pas une architecture de production. |

Pour les premières séances, je garderais seulement quelques questions facultatives et utiles à la préparation. Un formulaire médical ou un suivi biométrique n’a pas sa place dans l’onboarding de découverte. Le périmètre des mineurs, l’accompagnement parental et les justificatifs nécessaires doivent aussi être décidés avant d’ouvrir ces réservations.

## Les ajouts qui prolongeraient directement la promesse

**1. « Prévenez-moi si une place se libère ».** L’utilisateur indique un sport, un secteur et une plage horaire, ou suit les créneaux d’un coach précis. Il reçoit une proposition pertinente, avec durée de validité claire et possibilité de désactiver l’alerte. Pas de réservation automatique ni de promesse de créneau garanti. Fresha utilise déjà une liste d’attente et des notifications lorsqu’une disponibilité compatible apparaît : [documentation officielle](https://www.fresha.com/help-center/knowledge-base/calendar/259-set-up-and-manage-your-waitlist). Pour Partant, la différence serait de partir aussi du moment recherché dans le quartier.

**2. « Garder ce rythme ».** Après une première bonne séance, proposer deux à quatre prochains rendez-vous. Montrer le prix et la disponibilité de chaque occurrence, permettre d’en retirer une et annoncer les conditions de report. Commencer par une série confirmée explicitement ; éviter un abonnement reconduit par défaut. Les packs à tarif réduit peuvent venir ensuite, une fois les règles de crédit, d’expiration et de remboursement définies.

**3. Un rendez-vous préparé en quelques secondes.** Une fiche « Pour votre séance » regroupe objectif, matériel, accès et message du coach. Après la séance : avis lié à la réservation et nouvelle réservation. La messagerie et l’avis existent déjà en démonstration ; il s’agit de mieux organiser leur usage au bon moment.

**4. Une mise en ligne coach vérifiable.** Conserver la checklist existante et ajouter un aperçu « ce que voit un client », avec la première disponibilité réellement réservable. Si aucune séance ne peut être vendue, expliquer la cause précise : calendrier fermé, offre trop longue, justificatif en attente ou zone incompatible.

La confiance doit correspondre à des opérations réelles. CoachUp documente un processus de contrôle des coachs : [centre d’aide](https://support.coachup.com/hc/en-us/articles/203652577-How-does-CoachUp-ensure-the-quality-of-its-coaches). Le principe à retenir est la vérification effective derrière le badge, avec un périmètre adapté au marché de Partant ; il ne s’agit pas de reprendre automatiquement les contrôles d’un autre pays.

## La question marketplace : pourquoi rester sur Partant ?

Une fois le premier contact établi, coach et client peuvent organiser la suite ailleurs. Partant doit rendre les réservations suivantes utiles : agenda fiable, reports simples, paiements et justificatifs centralisés, assistance et rythme facile à maintenir. La commission doit avoir une contrepartie visible pour les deux personnes.

Le coach doit aussi pouvoir inviter ses clients existants par un lien de profil. Il faudra distinguer l’origine des réservations pour mesurer ce que la plateforme apporte ; les règles de commission par origine restent une décision commerciale à tester.

## La couverture locale avant la multiplication des fonctions

La liste de toutes les communes franciliennes facilite la recherche ; elle ne crée pas l’offre. Je testerais d’abord quelques zones proches avec une sélection de disciplines et suffisamment de créneaux réellement ouverts. Une expérience réussie à une échelle réduite donnera de meilleurs enseignements qu’un catalogue très large où les recherches restent vides.

À observer : part des recherches avec un résultat compatible, délai avant la première séance, passage du créneau au paiement, deuxième réservation, annulations côté coach, temps de configuration et demandes d’assistance par réservation. Les entretiens client et coach doivent expliquer les abandons ; les chiffres seuls ne suffisent pas.

## Séquence recommandée

1. Tester les parcours existants avec des clients et des coachs, particulièrement une recherche précise et une publication d’offre.
2. Prototyper la liste d’attente, la préparation de séance et deux ou trois imprévus majeurs.
3. Définir l’administration et connecter les services réels avant toute ouverture payante.
4. Tester la réservation de plusieurs prochaines séances après avoir observé la fidélisation.

Je différerais le fil social, les défis, les classements, la nutrition, les objets connectés et les statistiques d’entraînement. Ils ne résolvent pas encore le principal problème : trouver un bon coach réellement disponible près de soi, puis avoir envie de le retrouver.
