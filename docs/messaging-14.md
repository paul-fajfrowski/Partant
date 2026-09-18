# Messagerie par personne — 18 septembre 2026

Amélioration demandée et autorisée après le gel du MVP. React Native reste la version de travail ; le prototype HTML validé est conservé sans modification.

## Parcours livré

- Une discussion par relation coach/client, réunissant toutes leurs séances, passées ou futures. Les personnes inscrites à un même cours collectif gardent des échanges privés distincts avec le coach.
- Liste avec portrait du coach ou initiales du client, nom, aperçu du dernier message, date/heure, nombre de non-lus et recherche par nom insensible aux accents et à la casse.
- Conversations récentes en tête ; état du brouillon ou de l’envoi non confirmé visible dans la liste.
- Séparateurs chronologiques, heures de Paris et statut de lecture discret. Les anciens messages sans date sont explicitement rangés dans un historique non daté.
- Récapitulatif de séance ouvrable. Lorsqu’il existe plusieurs séances, le client ou coach peut choisir celle liée au prochain message. Chaque message conserve le contexte de la séance au moment de l’envoi ; les propositions restent des actions métier dans la réservation.
- Brouillons conservés par compte et conversation sur l’appareil, avec leur choix de séance.
- Envoi en cours, échec explicite, texte conservé et bouton Réessayer. Un nouvel écrit dans le composeur reste distinct du message à renvoyer.
- Lecture synchronisée pour les messages chargés dans la conversation et leurs notifications. Une arrivée concurrente non chargée n’est pas marquée lue.

## Implémentation et compatibilité

Le stockage serveur conserve les messages par réservation. L’interface les regroupe par paire `(coach, client)` après contrôle des droits : aucune fusion entre participants d’un cours collectif, aucun changement des autorisations publiques.

Les nouveaux messages reçoivent un identifiant stable, une date serveur et un instantané de séance. Un renvoi après réponse réseau perdue conserve le même identifiant ; le serveur ne crée ni second message, ni seconde notification. Réutiliser cet identifiant avec un autre texte ou une autre réservation est refusé.

La commande `message` accepte un troisième argument facultatif `id` ; les anciens clients à deux arguments restent compatibles. La nouvelle commande `readConversation` reçoit la réservation d’entrée et les identifiants des messages chargés. Elle vérifie l’appartenance de toutes les séances à la même relation autorisée. Les anciens messages utilisent une référence d’index stable tant qu’ils sont conservés.

Le transport de messagerie attend l’accusé serveur, partage la file de commandes existante et vérifie l’état enregistré après un échec incertain. Les brouillons/envois en attente sont séparés des messages confirmés. Stockage local : `partant-messages-v1:<mode ou recette>:<compte>`. Ils ne sont pas synchronisés entre appareils ; les messages confirmés le sont via Supabase. Les notifications externes ne sont pas activées.

La suppression du compte retire les brouillons de cet appareil et les instantanés personnels des échanges concernés, en cohérence avec l’anonymisation existante des messages et réservations. Le domaine partagé a été régénéré ; `product-api` et `google-calendar` ont été redéployés. Aucun nouveau schéma SQL ni nouvelle permission Data API.

## Vérifications

- TypeScript strict et exports Expo web, iOS, Android.
- `test-messaging.cjs` : 26 contrôles métier — regroupement, contexte, confidentialité, groupes, lecture, dédoublonnage, anciens messages et anonymisation.
- `test-messaging-web.cjs` : 20 contrôles DOM — recherche, plusieurs séances dans un fil, brouillon après rechargement, choix de séance, double clic, lecture et séparation des comptes.
- `test-messaging-connected-web.cjs` : essais Supabase réels avec coupures réseau injectées dans le navigateur de test : réponse perdue après écriture, reprise sans doublon, coupure avant écriture, message retrouvé après rechargement, confidentialité et identifiant non réutilisable pour un autre texte. 15 contrôles réussis, y compris la conservation du nouveau brouillon et de sa séance pendant le renvoi d’un message antérieur.
- Non-régression domaine : 172 contrôles ; commandes serveur : 61 ; notifications : 39.
- Navigation : 28 contrôles DOM ; parcours client : 33 ; réglages : 14 ; notifications client/coach : 17 + 7 ; recette visible : 10 étapes et 19 contrôles.
- API déployée : 36 contrôles ; parcours client/coach connecté : 11 ; rejeu concurrent : 3 ; configuration coach connectée : 7.

Les comptes de recette sont isolés avec des adresses `example.invalid`. Aucun message n’est envoyé à une personne réelle, aucun e-mail ni paiement n’est déclenché. Nettoyage vérifié : zéro compte, session, objet Storage et document métier restant pour les identités QA.

Les contrôles DOM ne constituent pas une revue visuelle sur téléphone. Clavier, défilement et rendu sur iOS/Android restent à vérifier sur appareil. L’actualisation connectée conserve le rythme existant de cinq secondes et au retour au premier plan ; il ne s’agit pas d’une connexion temps réel par WebSocket. Un accès initial connecté nécessite le réseau ; les brouillons et envois non confirmés restent locaux.

L’advisor Supabase garde les constats antérieurs : protection contre les mots de passe compromis désactivée et sept informations RLS sur des tables privées réservées au serveur. Aucun accès public ajouté.

## Essai manuel

Ouvrir `http://127.0.0.1:8081/simulation.html?mode=demo&version=messages-14`.

1. Réserver deux séances avec le même coach : Mon espace → Mes messages présente une seule conversation.
2. Choisir la séance concernée, écrire sans envoyer, revenir puis rouvrir : le brouillon est retrouvé.
3. Envoyer puis passer au compte coach : Messages affiche l’échange et sa séance. Ouvrir la conversation actualise les non-lus.
4. En mode connecté, couper le réseau après ouverture de la discussion et envoyer : le texte reste dans un envoi non confirmé. Rétablir le réseau puis réessayer.

Pour tester les données serveur, utiliser `mode=connected` et un compte Google/Apple autorisé. Le code des comptes QA temporaires n’est pas un parcours utilisateur.
