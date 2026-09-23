# Agenda : disponibilités et rendez-vous — livraison 29

23 septembre 2026. Amélioration demandée après confusion entre une plage configurée et une séance réservée.

## Parcours

- L’agenda distingue « Mes disponibilités » et « Mes rendez-vous ». L’état vide indique « Aucune réservation pour le moment ».
- Chaque plage est un bouton : horaire exact, nom de l’offre unique ou nombre d’offres associées, chevron de consultation.
- La fiche partagée WebApp / React Native affiche date, intervalle, formules, durée, tarifs, capacité des groupes, lieux/adresses et éventuels frais de déplacement à domicile.
- Les départs réservables proviennent du moteur existant. Une plage configurée n’est pas automatiquement une réservation ni une garantie de publication. Les offres désactivées, la publication, la vérification, la compatibilité des lieux et la durée sont distinguées.
- Les cours collectifs datés sont conservés dans les rendez-vous même avec zéro inscrit. Une plage sans cours daté ne crée aucun cours. La fiche permet de consulter un cours existant et ses inscriptions.
- « Modifier les horaires de cette date » ouvre l’éditeur sur la date consultée ; « Gérer mes offres » rejoint les tarifs. Consulter et fermer la fiche ne modifie pas les horaires.
- Sur téléphone, Configurer accompagne les disponibilités. Le compteur zéro redondant a été retiré. Le lien de modification d’une date reprend désormais la date sélectionnée.
- Une plage supprimée/modifiée à distance ne laisse pas une ancienne fiche exploitable. La sélection est effacée lors d’un changement de compte.

## Validation

- TypeScript : aucune erreur.
- Projection des plages : 12 contrôles, dont offres/lieux limités à la plage, horaires libres 12:07/12:37, réservation occupant un départ, offre en pause, profil non publié, pratique non autorisée, groupe sans inscrit et exception datée.
- Agenda existant : 13 contrôles de présentation.
- Chrome 390 et 1440 px : 20 contrôles, dont consultation sans mutation, tarif/lieu, fermeture, bonne date dans l’éditeur et absence de débordement horizontal. Captures inspectées.
- Recette WebApp existante : 45 contrôles.
- Export web et bundle Hermes iOS réussis. Pas de compilation Xcode signée ni de nouvelle validation sur iPhone physique dans cette recette.

Sources partagées : `AvailabilityRange.tsx` et `rangeDetailsModel.ts`. Aucun changement de règles métier, de réservations, de schéma serveur, d’horaires imposés ou de dépendances natives. Le projet Xcode utilise les mêmes sources après recompilation.
