# Notifications générales sans doublon de messagerie — 16

> État actuel : [la livraison 17](notifications-paging-17.md) ajoute la pagination, l’accès aux actions et la conservation de la position. Les constats ci-dessous décrivent les étapes antérieures.

Demande utilisateur du 18 septembre 2026 : retirer la rubrique Messages des notifications, puisque la messagerie possède déjà son entrée dédiée.

## Livré

- Les messages explicites et historiques sont exclus des rubriques de notifications et du compteur général client/coach, y compris le rappel sur l’agenda coach.
- Le compteur et les conversations de la messagerie restent inchangés. Lire une conversation actualise uniquement ses messages et leurs états de lecture.
- Aucun événement stocké n’est supprimé, aucune donnée n’est artificiellement marquée comme lue. Aucun changement de protocole ou de service serveur.
- La simulation de volume reflète la nouvelle organisation : 230 notifications générales et 216 messages répartis en 36 conversations, au lieu de 446 événements réunis dans Notifications.

## Suite proposée, non implémentée

La demande porte aussi sur la meilleure manière de raccourcir les rubriques. La recommandation reste : 10 événements récents par défaut, puis « Voir les précédents », avec accès explicite aux actions encore en attente, même anciennes. Conserver l’état de consultation au retour d’un détail. Aucun nouveau filtre n’est nécessaire à ce stade.

Les longues listes sont encore affichées dans cette version : le retrait du doublon ne prétend pas résoudre seul le volume des réservations.

## Vérification

TypeScript et export web réussis. Modèle notifications : 48 contrôles ; modèle messagerie : 26 ; notifications client : 18 ; notifications coach : 9 ; messagerie DOM : 23 ; navigation : 28 ; scénario de volume : 22. Total : 174 contrôles automatisés réussis. Le parcours visible actualisé passe ses 7 étapes dans le harness DOM. Le harness attend désormais la disponibilité des boutons pour éviter les faux échecs dus au démarrage asynchrone. Les tests DOM ne constituent pas une mesure de performance ou une validation visuelle sur appareil.

Le rapport initial `simulation-volume-coach.md` et `coach-volume-results.json` restent une mesure avant ce changement ; `coach-volume-without-messages-results.json` décrit l’état après retrait. Le parcours `coach-volume.html?autoplay=1` utilise l’interface actuelle.
