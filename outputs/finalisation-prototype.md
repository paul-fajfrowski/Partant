# Partant — finalisation du prototype

Version du 16 septembre 2026. Cette livraison prolonge la sauvegarde GitHub `992eb4b`. Les parcours A1–A9 sont implémentés et testables localement. Elle ne connecte aucun service de production.

## Ce qui a changé

| Lot | Parcours disponible | Limite explicite |
|---|---|---|
| A1 — Connexion avant réservation | L’invité explore puis se connecte ou s’inscrit avant de payer. Coach, offre, créneau, objectif et nombre de places sont conservés ; l’offre est revérifiée au paiement. | Identités fictives et code 123456, aucun e-mail. |
| A2 — Présentation et test | Présentation épurée par défaut. « À propos de la simulation » active les comptes fictifs, incidents, horloge et espace équipe. | Une séparation d’interface, pas une autorisation serveur. |
| A3 — Calendrier glissant | Date réelle, heure de Paris, navigation par semaines sur 90 jours, horizon coach de 7 à 90 jours. Les anciennes réservations gardent leur date. Les séances dont la fin est dépassée passent à l’historique à l’actualisation. Export ICS en UTC, compatible avec le changement d’heure. | L’état « terminée » indique que l’horaire est passé, pas une présence certifiée. |
| A4 — Semaine et exceptions | Jusqu’à trois plages distinctes par jour, journées fermées et exceptions datées. Les plages incompatibles sont refusées. Réservations confirmées conservées. | Une exception propose une plage ou une fermeture ; les blocages privés peuvent compléter la journée. |
| A5 — Paiement et remboursement | Attente de validation, refus en mode test, interruption, expiration après dix minutes, nouvelle tentative, sélection devenue indisponible et prévention de la double validation. Tentatives retrouvables dans Mon espace/Séances. Suivi des remboursements en attente puis confirmés en test. | Aucun encaissement, verrou entre appareils ni événement bancaire réel. Une tentative ne bloque pas l’inventaire. |
| A6 — Compte | Coordonnées modifiables, contrôle d’unicité de l’e-mail par rôle, aide à la connexion, rappels, export JSON limité au compte, déconnexion et suppression locale après traitement des séances confirmées. | Les références de rendez-vous restent chez les interlocuteurs ; cela ne constitue pas encore une politique de conservation en production. |
| A7 — Dossier coach | Références de pièces fictives, soumission, attente, correction, refus motivé, nouvelle soumission, validation équipe, expiration et historique. La publication est bloquée si le dossier n’est plus valide. | Aucun document personnel à fournir ; aucun contrôle réel ni badge de production. |
| A8 — Proposition du coach | Proposition horaire/lieu en individuel ou duo ; transfert de toutes les places d’une réservation collective vers un cours du même coach au même prix. Accord/refus client, retrait coach, expiration, notifications et recontrôle des disponibilités. | Le rendez-vous initial reste confirmé tant qu’il n’y a pas d’accord. Pas de déplacement automatique de tout un cours ni de supplément imposé. |
| A9 — Rappels et alertes | Rappel dans les 24 heures, dédoublonnage par séance/horaire/destinataire, respect des préférences. Alertes de nouvelles disponibilités compatibles avec les places souhaitées et sans conflit avec une séance du client. | Recalcul à l’ouverture d’un écran ; aucun traitement en arrière-plan, push, SMS ou e-mail. |

## Tester la version

Ouvrir `partant.html`, ou lancer l’aperçu local depuis la racine du projet :

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory outputs
```

Puis ouvrir http://127.0.0.1:8766/partant.html.

### Réservation en invité et paiement

1. Choisir « Explorer d’abord », une date future puis un créneau.
2. Remplir les détails et continuer : la connexion reprend la sélection.
3. Utiliser `alex@example.test` et `123456`, ou créer un compte fictif.
4. Continuer vers le paiement puis valider la simulation.
5. Pour tester un refus : activer « À propos de la simulation → Test » avant le parcours. L’interruption est disponible dans les deux modes.
6. Retrouver une tentative interrompue dans « Mon espace » ou « Séances ».

### Coach, horaires et proposition

1. Activer le mode Test et choisir Thomas.
2. Dans Réglages → Horaires : déplier les jours, enregistrer les plages et ajouter une exception.
3. Ouvrir une séance confirmée puis « Proposer un autre horaire / lieu ».
4. Passer sur le compte du client ; ouvrir la notification et accepter ou refuser.
5. Pour un groupe, créer d’abord un cours de remplacement au même tarif avec assez de places. La proposition concerne la réservation sélectionnée.

### Dossier coach et rappels

1. Réglages → Justificatifs : saisir quatre références fictives, une date de validité future et soumettre.
2. En mode Test, ouvrir « À propos de la simulation → Espace équipe », puis examiner le dossier et motiver la décision.
3. Le coach retrouve la décision dans ses notifications. Après validation, la publication reste une action explicite.
4. Pour les rappels : réserver une séance future, puis avancer l’horloge de test jusqu’à moins de 24 heures avant son début. L’outil est explicite : avancer le temps peut également terminer des séances.

## Validation

- 337 contrôles de non-régression existants réussis.
- 117 contrôles supplémentaires : reprise invité, groupes, dates et changement d’heure, horaires, paiement, conflits, consentement, compte, documents, rappels et alertes.
- 24 contrôles avec un DOM complet (jsdom), en cliquant sur les éléments et en soumettant les formulaires : réservation, rôles, notification, proposition acceptée, planning et décision documentaire.
- **478 vérifications au total.**

**Revue visuelle mobile validée par le porteur du projet le 16 septembre 2026**, après consultation du prototype A1–A9. Cette validation utilisateur complète les tests automatiques. Le lancement de Chrome automatisé était bloqué dans l’environnement : aucune capture automatisée ni audit complet d’accessibilité n’est revendiqué.

## Passage au MVP réel

Le reste à faire B1–B8 demeure explicite dans `MVP-etat-des-lieux.md`. Commencer par l’identité et les autorisations serveur, une base partagée et les transactions de réservation, puis connecter paiements et envois. Ces services ne sont pas livrés par cette finalisation du prototype.
