# Tests sur le projet de développement

`foundation.sql` s’exécute comme une seule requête dans le SQL Editor / MCP, sur le projet dédié au développement. Il crée ses fixtures dans une transaction, utilise le rôle `authenticated` avec des sujets distincts et annule toutes les données via ROLLBACK. Les 16 assertions couvrent les restrictions et erreurs métier principales. Ce script ne vérifie pas la délivrance d’un JWT par Supabase Auth.

Pour reproduire la concurrence (uniquement sur le projet de développement) :

1. Exécuter `concurrency-setup.sql` une seule fois.
2. Envoyer `concurrency-client-a.sql` et `concurrency-client-b.sql` simultanément, via deux connexions distinctes. Le verrou suivi d’une pause maintient volontairement la concurrence sur la dernière place.
3. Attendre une réussite et une erreur `SLOT_FULL`.
4. Exécuter `concurrency-cleanup.sql` : vérifie exactement une réservation et retire uniquement les UUID de ces fixtures, y compris auth.users.

Les fixtures ne créent pas de compte utilisateur utilisable pour se connecter, n’envoient pas d’e-mail et ne servent pas de données de démonstration permanentes. Ne jamais lancer ces scripts sur une base de production.

Les fichiers de migration ont été créés par `supabase migration new`, puis leurs préfixes alignés sur les versions renvoyées par l’historique du projet après application via MCP.
