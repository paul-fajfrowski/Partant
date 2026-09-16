# Partant — priorité 1 livrée

Version du 15 septembre 2026. Complétée le 16 septembre par **priorite-2.md**, qui ajoute les transferts, les annulations partielles et les propositions de séances suivantes. Ouvrez `partant.html` : le fichier contient ses styles, sa logique, sa police et ses portraits. Cette étape relie les parcours existants autour de comptes distincts et de données communes de réservation.

## Ce qui est fonctionnel dans le prototype

| Sujet | Comportement |
|---|---|
| Comptes particuliers | Alex et Nina disposent de réservations, favoris, préférences, alertes et échanges distincts. On peut créer un autre compte fictif. |
| Comptes coachs | Les six coachs ont leurs propres offres, prix, lieux, horaires et dossiers clients. Une inscription coach crée un nouveau profil en brouillon, avec sa checklist. |
| Disponibilités communes | Les réservations occupent le planning du bon coach. Les inscriptions de différents clients consomment la même capacité de groupe. |
| Messages | Une conversation par réservation, partagée entre le client et son coach. Messages envoyés/lus, compteur de non-lus, accès depuis les séances et les espaces personnels. |
| Avis | Publication après une séance terminée, affichage sur le profil, recalcul de la note et du nombre d’avis, réponse du coach. |
| Modération | Signalement d’un avis ou d’un profil, examen dans l’espace équipe de démonstration, décision motivée. Un avis masqué ne contribue plus à la note. |
| Formats | Filtres Tous / Individuel / Duo / Groupe. Le prix et la durée suivent l’offre sélectionnée. Un coach proposant seulement des groupes présente ses cours, sans calendrier individuel trompeur. |
| Profil public | Portrait au choix ou import JPEG/PNG/WebP, introduction, méthode, spécialités et informations professionnelles modifiables. Prévisualisation avec la disponibilité réellement réservable dans la démo ou une explication de blocage. |

La direction visuelle reste monochrome, avec les boutons arrondis, la photographie et les icônes sportives dessinées. La recherche mobile a été resserrée pour laisser les premiers créneaux visibles malgré l’ajout du filtre de format.

## Parcours de test conseillé

1. À l’accueil, ouvrez **Essayer les comptes de démonstration**. Si vous êtes déjà connecté : **Mon espace → Changer de compte**, ou le bouton équivalent dans l’espace coach.
2. Ouvrez Thomas. Dans **Réglages → Séances & tarifs**, créez une offre Groupe à **20 €/personne**, **6 participants maximum**, puis planifiez un cours le mercredi 16 septembre à 18 h. Le créneau doit être compatible avec vos horaires, pauses et réservations existantes.
3. Ouvrez Alex, choisissez **Groupe** et la date du cours, puis réservez **3 places : 60 €**.
4. Ouvrez Nina et réservez **2 places : 40 €** dans le même cours. Il reste **1 place**. Chaque compte ne retrouve que ses propres réservations.
5. Depuis la séance de Nina, écrivez au coach. Ouvrez Thomas → **Messages**, lisez et répondez. Revenez sur Nina pour retrouver cette même conversation.
6. Dans Nina → **Mon espace → À propos de ce prototype → Simuler une séance terminée**, terminez sa réservation fictive. Dans **Séances → Passées**, laissez un avis puis ouvrez le profil du coach.
7. Dans Thomas → **Réglages → Prévisualiser mon profil**, répondez à l’avis. Le client retrouve cette réponse sur le profil.
8. Modifiez le portrait ou la phrase d’introduction dans **Réglages → Votre profil**, enregistrez puis prévisualisez. Rechargez le fichier pour vérifier la conservation des modifications.

Pour créer un nouveau compte, utilisez une adresse fictive différente et le code **123456**. Une connexion à une adresse inexistante affiche une erreur ; l’inscription à une adresse déjà utilisée pour le même rôle invite à se connecter. Aucun e-mail n’est envoyé.

## Données et compatibilité

Les essais sont conservés dans le stockage local du navigateur lorsque celui-ci l’autorise. Les anciennes réservations du prototype sont attribuées au compte Alex ; les anciens réglages coach à Thomas. Aucun groupe n’est préactivé dans un stockage neuf : il faut créer l’offre puis planifier le cours.

Utilisez les changements de compte dans **le même onglet** pour tester les interactions. Le fichier ouvert directement et l’aperçu HTTP ont des stockages distincts. Il n’y a pas de synchronisation en temps réel entre onglets, appareils ou navigateurs.

Les photos importées sont limitées à 600 Ko chacune pour limiter le stockage. Un changement de portrait dans la galerie est enregistré immédiatement ; les champs de texte sont conservés pendant ce choix et s’enregistrent avec le bouton Enregistrer.

L’horloge reste fixée au **14 septembre 2026 à 08:00, heure de Paris**, sur quatorze jours, pour garder les scénarios reproductibles.

## Ce qui reste en dehors de cette étape

La priorité 1 est complète dans le périmètre de démonstration ci-dessus. Ce n’est pas une application de production : authentification, autorisations côté serveur, paiement, versements, vérification documentaire, notifications et calendriers connectés restent simulés. L’espace équipe est accessible pour tester les décisions, sans contrôle d’accès réel.

Les cours récurrents automatiques, les annulations partielles de places, les transferts entre cours et un inventaire étendu au-delà des quatorze jours ne sont pas ajoutés ici. Les communes d’Île-de-France sont sélectionnables, mais l’offre fictive demeure parisienne ; les distances et la carte sont schématiques.

La suite doit conserver la même exigence : fermer les parcours manquants avec leurs erreurs et conséquences, plutôt qu’ajouter des écrans sans données reliées. La feuille de route générale conserve les sujets de lancement réel séparément du périmètre du prototype.

## Correctif — notifications de réservation

Les nouvelles réservations, modifications de créneau, annulations, variations de participants et remboursements créent désormais un événement pour l’autre partie concernée. Le coach dispose d’un compteur Notifications et d’un aperçu de la dernière alerte dans son agenda. Une modification montre l’ancien et le nouvel horaire ; Voir la séance ouvre le rendez-vous actualisé et marque l’événement comme lu. Les événements sont conservés après rechargement, sans doublon lors d’un simple enregistrement.

Côté client, l’historique est accessible dans **Mon espace → Mes notifications**, notamment après une annulation du coach. Côté coach, **Réglages → Notifications** contrôle les alertes et compteurs des réservations et changements ; les événements désactivés restent consultables en mode silencieux. Les rappels et actualités demeurent des préférences simulées.

Pour tester le correctif, rechargez le HTML puis effectuez une nouvelle modification. Les modifications antérieures à cette version ne génèrent pas d’alertes rétroactives. Changez de compte dans le même onglet. Aucun push système, e-mail ou SMS n’est envoyé.

**Distinction entre démo et produit :** Démo · Comptes et les raccourcis de passage client/coach sont des commandes de démonstration. La messagerie et les notifications sont des fonctionnalités du produit ; leur accès commun aux onglets du coach est une décision de navigation, pas un compte fictif supplémentaire. Dans une version réelle, le passage d’un rôle à l’autre ne concernerait que les rôles autorisés du même utilisateur.
