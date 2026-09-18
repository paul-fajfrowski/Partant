# Notifications utiles — 18 septembre 2026

> Présentation actualisée par [la livraison 15](communication-15.md) : notifications par rubriques et conversation sans sélecteur de séance. Les éléments ci-dessous décrivent la livraison antérieure.

Amélioration explicitement autorisée par le propriétaire après le gel du MVP : faciliter la lecture et l’action, sans ajouter de catégories ou de navigation superflues. React Native demeure la seule version de travail. Le prototype HTML archivé est inchangé.

## Expérience livrée

- Un fil commun aux deux rôles : Aujourd’hui, Hier, Cette semaine, puis dates explicites. Tri par réception décroissante, heure de Paris.
- Deux filtres : Tout et À traiter. Une réservation automatiquement confirmée est une information ; une proposition attendant une réponse est une action. Les incidents d’agenda et les justificatifs à corriger/renouveler renvoient à leur configuration.
- Un point discret et une différence typographique indiquent la lecture ; un libellé accessible accompagne le point. Lire ne résout jamais une action métier.
- Contexte conservé lors de l’événement : personne, prestation, date, heure, nombre de places. Une modification montre avant/après et le changement d’adresse éventuel. Le client voit le coach ; le coach voit le client.
- Liens directs vers la séance, la proposition exacte, la conversation, les avis, la réponse de l’assistance ou le réglage concerné.
- Une proposition résolue conserve son résultat. Une nouvelle proposition retire la précédente ; une réservation ayant changé ou dépassé le délai de modification ne présente plus une proposition comme actionnable.
- Ouvrir une conversation marque ses notifications de messages comme lues, sans effacer les alertes de réservation. En démo locale aussi, envoyer un message avertit l’autre rôle.
- La fiche de séance regroupe ses événements. Les détails des opérations existants restent consultables à la demande afin d’éviter deux historiques développés en parallèle.

## Données et compatibilité

`Notice` possède désormais des champs optionnels `createdAt`, `event`, `context`, `previous`, `proposalId`, `ticketId`, `resolvedAt`. Les événements nouveaux sont datés par le domaine partagé, exécuté côté serveur en mode connecté. Les instantanés ne contiennent ni objectif privé, ni contenu du message, ni diagnostic du fournisseur d’agenda.

Les anciennes notifications sans date restent dans « Historique » avec « Date de réception non renseignée ». Leur contexte actuel est signalé comme tel, sans inventer de date de réception. Les anciennes propositions ambiguës ne sont pas associées arbitrairement : la maintenance réémet au besoin une seule notification pour la proposition encore ouverte. Les incidents d’agenda ne génèrent pas un nouvel événement à chaque actualisation ; leur résolution conserve l’historique.

Les notifications et la lecture restent limitées au destinataire authentifié. Aucun nouveau schéma SQL : les champs facultatifs sont persistés dans les documents métier existants. `product-api` et `google-calendar` ont été redéployés avec le domaine partagé régénéré.

## Recette exécutée

| Vérification | Résultat |
| --- | --- |
| TypeScript strict | Réussi |
| Domaine notifications : dates/Paris/changement d’heure, snapshots, confidentialité, propositions, lecture/action, incidents, anciens événements | 39 contrôles réussis |
| Parcours écran client notifications | 17 contrôles DOM réussis |
| Parcours écran coach notifications | 7 contrôles DOM réussis |
| Non-régression domaine existant | 172 contrôles réussis |
| Autorisations et commandes serveur partagées | 61 contrôles réussis |
| Chiffrement/agenda avec fournisseur simulé | 16 contrôles réussis |
| Navigation et parcours existants dans les écrans | 121 contrôles DOM réussis |
| Recette visible | 10 étapes, 19 contrôles, stockage démo habituel préservé |
| Supabase déployé : API/Auth/concurrence/confidentialité/Storage | 36 contrôles réussis |
| Parcours client → notification coach connecté | 11 contrôles DOM/Supabase réussis |
| Rejeu concurrent déployé | 3 contrôles réussis |
| Configuration coach connectée | 7 contrôles DOM/Supabase réussis |
| Points d’entrée Google et démarrage OAuth | 12 + 11 contrôles réussis |
| Exports Expo web/iOS/Android | Réussis ; il ne s’agit pas de builds natifs signés |

Les tests Supabase ont utilisé quatre comptes QA isolés, sans e-mail ni paiement réel. Nettoyage vérifié : zéro compte, session, objet Storage ou document métier conservé pour ces identités.

L’advisor Supabase garde les constats précédents : protection contre les mots de passe compromis désactivée ; sept informations RLS sans politiques sur les tables privées réservées au serveur. Aucun accès public n’a été ajouté.

Cette recette ne constitue pas une validation visuelle sur appareil. Google/Apple web restent validés par le propriétaire ; consentement agenda réel, essais natifs et autres limites du MVP restent ceux de `gel-mvp.md`. Les push, SMS, e-mails transactionnels et paiements réels restent reportés. Les alertes d’agenda dans l’application reflètent l’état reçu du serveur ; aucun envoi externe n’est ajouté.

## Essayer

Ouvrir `http://127.0.0.1:8081/simulation.html?mode=demo&version=notifications-13` après export et lancement du serveur local.

1. Réserver puis modifier une séance comme client ; ouvrir les notifications du coach et retrouver la date de réception ainsi que l’ancien/nouvel horaire.
2. Faire une proposition côté coach ; côté client, Mon espace → Mes notifications → À traiter.
3. Ouvrir puis revenir sans répondre : elle reste à traiter. Répondre : elle sort du filtre et son résultat reste dans Tout.
4. Envoyer un message puis ouvrir sa notification depuis l’autre compte : la conversation s’ouvre et les alertes de réservation restent non lues.
5. Retrouver les événements depuis le détail de la séance.

La simulation utilise le stockage de démonstration existant. Pour le serveur de développement, employer `mode=connected` avec un compte autorisé. Ne pas utiliser les comptes QA de recette, supprimés après vérification.
