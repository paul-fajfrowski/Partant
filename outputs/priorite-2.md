# Partant — priorité 2

Livrée le 16 septembre 2026. Ouvrez ou rechargez **partant.html**. Le fichier reste autonome ; les essais sont conservés dans le navigateur.

## Trois parcours reliés

### Réserver à nouveau

Depuis une séance passée, **Réserver à nouveau** ouvre « Garder le rythme ». Depuis le détail d’une séance à venir, **Prévoir la prochaine séance** ou **Prévoir le prochain cours** prépare la suite.

Le prototype propose jusqu’à trois prochains jours disponibles chez le même coach, avec la durée et le tarif actuels. La séance précédente aide à retrouver l’offre, le lieu et l’objectif ; le client vérifie le récapitulatif puis confirme chaque nouvelle réservation. Si une offre a disparu, une alternative est explicitement présentée. Les conflits avec les autres séances du client sont exclus.

Pour un groupe, les prochains cours présentent leurs places disponibles et leur prix par personne. Le nombre de participants précédent est prérempli dans la limite des places restantes, puis reste modifiable avant paiement. S’il n’existe aucune possibilité compatible, l’écran propose le profil complet et une alerte de disponibilité.

Aucune récurrence ni dépense automatique n’est créée.

### Transférer une réservation de groupe

**Séances → Détails → Changer de cours** propose les autres cours du même coach qui peuvent accueillir toutes les places réservées, sans chevaucher l’agenda du client.

Le transfert est permis jusqu’à la limite d’annulation gratuite de la réservation initiale. Après cette limite, les places restent réservées et le client peut contacter le coach ou l’assistance.

Avant de confirmer, l’utilisateur voit :

- Le cours, la date, l’horaire, la durée et le lieu de destination.
- La valeur des places actuelles et celle des nouvelles places.
- Le supplément à payer ou le montant à rembourser.
- Les nouvelles conditions d’annulation, y compris lorsque le cours choisi commence trop prochainement pour permettre une annulation gratuite.

La disponibilité, le nombre de places et les conditions sont revérifiés à la confirmation. Un cours devenu complet ou fermé, un conflit, un changement de prix ou de la réservation empêche le transfert. Le client doit revoir le récapitulatif. L’incident de paiement fictif disponible dans le récapitulatif conserve intégralement la réservation initiale.

Après confirmation, les anciennes places sont libérées et les nouvelles sont occupées. **La référence et la conversation restent les mêmes.** Les consignes et le lieu suivent le nouveau cours ; le mémo de préparation est remis à zéro. Le coach reçoit une notification de transfert. Le client est invité à actualiser son calendrier exporté.

### Annuler certaines places

**Séances → Détails → Annuler certaines places** permet de choisir le nombre de places à garder, avec un minimum d’une. L’annulation de toute la réservation reste une action distincte.

Le récapitulatif montre les places conservées, celles annulées, le remboursement et le total net restant. Les places libérées redeviennent disponibles ; la réservation restante garde son horaire et sa conversation. Le coach reçoit une notification indiquant l’ancien et le nouveau nombre de participants.

Avant la limite d’annulation gratuite, les places retirées sont remboursées à leur tarif réservé. Après la limite, elles sont libérées mais restent dues ; le récapitulatif le dit avant confirmation. Une séance commencée ou clôturée n’est plus modifiable par ce parcours.

## Montants et suivi côté coach

Une réservation conserve ses **paiements cumulés**, ses **remboursements cumulés** et son **total net payé**. Les changements sont consultables dans son historique. Un transfert avec supplément ne réécrit pas le paiement initial ; une annulation partielle n’efface pas les remboursements antérieurs.

Exemple exercé dans le navigateur :

| Étape | Paiements cumulés | Remboursements cumulés | Total net | Places |
|---|---:|---:|---:|---:|
| Réservation à 20 €/personne | 60 € | 0 € | 60 € | 3 |
| Annulation gratuite d’une place | 60 € | 20 € | 40 € | 2 |
| Transfert vers un cours à 30 €/personne | 80 € | 20 € | 60 € | 2 |

L’activité du coach et le relevé CSV tiennent compte des suppléments et des remboursements. La commission de démonstration reste de 15 % sur le montant net conservé. Une annulation complète ultérieure ne rembourse que le solde encore remboursable, sans reverser deux fois les mêmes sommes.

## Scénario à essayer

1. Avec Thomas, créez une offre Groupe à 20 €/personne, capacité 6, et planifiez mercredi 16 septembre à 18 h.
2. Passez sur Alex et réservez trois places.
3. Avec Thomas, changez le tarif de l’offre à 30 €/personne, puis planifiez vendredi 18 septembre à 18 h. Le premier cours conserve son ancien tarif.
4. Avec Alex, ouvrez la séance et gardez seulement deux places : le remboursement annoncé est de 20 €.
5. Choisissez le transfert vers vendredi : deux nouvelles places valent 60 €, donc un supplément de 20 € est annoncé.
6. Vous pouvez d’abord ouvrir **Tester un incident de paiement · démo** et simuler un refus. La réservation de mercredi est conservée. Recommencez ensuite et confirmez le transfert.
7. Retrouvez vendredi, deux places et 60 € net dans la séance. Ouvrez l’historique des changements.
8. Passez sur Thomas : la notification, les deux cours et l’activité reflètent les modifications.
9. Dans l’historique d’Alex, choisissez la séance passée de Sarah puis **Réserver à nouveau** pour essayer les propositions de prochains créneaux et le paiement simulé habituel.

Les horaires doivent rester compatibles avec les réglages et les essais déjà enregistrés. Utilisez les changements de compte dans le même onglet. Le fichier HTML et l’aperçu HTTP possèdent des stockages distincts.

## Périmètre et limites

L’horloge de démonstration reste fixée au **14 septembre 2026 à 08:00, heure de Paris**, avec quatorze jours de planning. C’est volontairement indépendant du jour réel d’ouverture pour rendre les essais reproductibles.

Cette priorité couvre les trois parcours annoncés. Elle n’ajoute pas de packs, d’abonnement, de récurrence automatique, de transfert entre coachs, de déplacement d’une partie seulement d’une réservation vers un autre cours, ni d’identité individuelle pour chaque accompagnant.

Les paiements, remboursements et notifications restent internes à la démo. La revérification de capacité est locale ; une vraie marketplace nécessitera une transaction côté serveur et un prestataire de paiement. Les conditions présentées ici sont des règles de prototype.

Voir **verification.md** pour les contrôles effectués et **priorite-1.md** pour le socle comptes, messagerie, avis et profils.
