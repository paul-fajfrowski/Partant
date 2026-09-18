# Communication — simplification 15

Demande utilisateur du 18 septembre 2026. Cette livraison remplace la présentation des notifications et le sélecteur de contexte des livraisons 13 et 14, sans élargir le périmètre fonctionnel.

## Une conversation par personne

Toutes les séances avec une même personne restent dans le même fil. Le sélecteur « Séance liée au prochain message » et les rappels de séance répétés dans les bulles sont retirés. « Voir nos séances » ouvre une liste facultative pour accéder aux réservations ; consulter cette liste ne change pas le brouillon ni le destinataire.

Les dates, les états Envoyé/Lu, les brouillons par compte et conversation, la reprise d’un envoi non confirmé et la confidentialité restent en place. Le rattachement technique à une réservation est conservé en interne pour les droits et la compatibilité serveur. Il n’est plus présenté comme un sujet obligatoire de conversation.

## Des rubriques de notifications

L’entrée affiche uniquement les rubriques ayant des événements : Nouvelles réservations, Séances annulées, Séances modifiées, Propositions de changement, Messages, Rappels de séance, Avis et réponses, Agenda, Dossier coach, Assistance, Créneaux disponibles et Autres informations.

Une rubrique s’ouvre à la fois. Ses événements sont rangés du plus récent au plus ancien avec leurs repères de date. Les en-têtes indiquent le nombre de notifications, les non-lues et les actions encore attendues. Ouvrir une rubrique ne marque rien comme lu. Le filtre transversal À traiter est retiré ; les propositions et incidents conservent leur accès direct et leur état métier. Une proposition lue reste à traiter tant qu’elle n’est pas résolue.

La rubrique ouverte reste affichée au retour d’un détail ; elle se réinitialise au changement de compte. Les événements sans date restent dans Historique. Les notifications de message renvoient à la conversation sans imposer de séance dans leur libellé.

## Vérification exécutée

- TypeScript : aucune erreur.
- Export Expo web, iOS et Android : réussi. Il s’agit de bundles, pas de builds signés installés sur téléphone.
- Modèle notifications : 46 contrôles ; modèle messagerie : 26.
- Parcours DOM notifications client : 20 ; coach : 9 ; messagerie : 23.
- Navigation DOM : 28 ; parcours principal DOM : 33.
- Recette visible : 10 étapes et 19 contrôles, stockage de démonstration préservé.

Total : 204 contrôles automatisés réussis. Les scénarios couvrent notamment l’absence de sélecteur, le fil commun à plusieurs séances, les brouillons et la double activation d’envoi, les rubriques repliées, le retour au même chapitre, la distinction lu/résolu et l’isolation des comptes.

Les scripts de recette connectée sont adaptés aux nouveaux libellés ; leur syntaxe est vérifiée, mais ils n’ont pas été rejoués contre Supabase pour cette modification de présentation. Aucun schéma ni service serveur n’a changé, aucun déploiement serveur n’est requis. Cette recette ne constitue ni une revue visuelle sur téléphone ni une validation des intégrations différées.

## Simulation

Après export, ouvrir http://127.0.0.1:8081/simulation.html?mode=demo&version=communication-15 et actualiser l’aperçu si nécessaire. Les mêmes composants sont utilisés en mode connecté. Le prototype HTML archivé reste inchangé.
