# Notifications : historique progressif et actions accessibles — 17

Demande approuvée par le propriétaire le 18 septembre 2026, après la simulation de volume.

## Comportement livré

- Chaque rubrique ouverte affiche les 10 événements les plus récents. « Voir les précédents » en ajoute 10 ; le bouton disparaît en fin d’historique.
- Le compteur indique le nombre affiché et le total. « Réduire l’historique » revient à 10 événements. Les totaux et les non-lus portent toujours sur l’ensemble des événements de la rubrique.
- L’accès « N actions à traiter » en haut filtre les rubriques sur les seules actions encore attendues, même anciennes et déjà lues. La première rubrique concernée s’ouvre automatiquement. Ce mode possède sa propre pagination et ne dépend pas de la profondeur consultée dans l’historique ordinaire.
- « Toutes les notifications » revient à l’ensemble des rubriques. Quand la dernière action est résolue, un état « Tout est traité » conserve ce chemin de retour. Lire un événement n’est pas le résoudre.
- Le retour d’un détail conserve la rubrique, le mode, le nombre d’événements chargés et l’offset de défilement. Ces données de consultation sont réinitialisées lors d’un changement de compte et ne sont pas conservées après fermeture de l’application.
- Les messages restent exclus des notifications générales ; leur compteur et leurs conversations restent dans la messagerie.

Il s’agit d’une pagination de présentation des données déjà chargées. Aucun changement du protocole serveur, de la base, ni du volume de données téléchargé n’est annoncé. La recherche ou de nouveaux filtres ne sont pas ajoutés.

## Vérifications

- Modèle notifications : 53 contrôles.
- Pagination et restauration du défilement : 13 contrôles DOM ; inclut une demande de restauration à 640 px, un incident encore ouvert masqué derrière 15 événements récents clôturés, la fin de pagination et la réduction d’historique.
- Simulation coach : 23 contrôles ; 10 lignes au départ au lieu de 144, 20 après chargement, mêmes données métier et compteurs indépendants de la messagerie.
- Notifications client : 20 contrôles ; une proposition ancienne ou déjà lue reste accessible et la résolution de la dernière action mène à un état vide clair.
- Notifications coach : 9 contrôles ; navigation : 28 contrôles.
- Parcours visible actualisé : 7 étapes réussies dans le harness DOM, données habituelles préservées.
- TypeScript et exports Expo web/iOS/Android réussis.

Total : 146 contrôles automatisés, plus le parcours visible. La restauration est vérifiée par l’appel de défilement demandé ; le rendu final, les changements de hauteur et le comportement tactile sur appareil restent à contrôler visuellement. Les exports natifs ne sont pas des builds signés installés sur téléphone.

## Simulation

http://127.0.0.1:8081/coach-volume.html?autoplay=1&version=notifications-17

Le parcours montre le chargement de 10 puis 20 événements, l’ouverture d’un détail et le retour à la liste, sa réduction, la messagerie séparée, puis l’accès aux actions anciennes. Après la lecture, l’écran reste utilisable librement.

Résultats chiffrés : `docs/coach-volume-paged-results.json`. Les fichiers `coach-volume-results.json` et `coach-volume-without-messages-results.json` conservent les mesures antérieures pour comparaison. Le prototype HTML de référence reste inchangé.

## Ajustement visuel validé ensuite

L’accès aux actions devient une pilule compacte limitée à son nombre et son libellé. Contour gris sur fond blanc au repos ; fond noir et texte blanc lorsqu’elle est sélectionnée. La flèche et la phrase explicative sont retirées. La cible tactile reste d’au moins 44 points. La pilule disparaît lorsqu’il n’y a plus d’action ; « Toutes les notifications » reste accessible si la vue filtrée est encore ouverte.
