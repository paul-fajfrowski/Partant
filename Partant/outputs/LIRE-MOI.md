# Partant — prototype, priorité 2

Ouvrez **partant.html** dans un navigateur. Photos, police, CSS, JavaScript et données sont intégrés au fichier ; aucune installation n’est nécessaire.

## Entrée particulier

1. Choisissez « Je veux bouger », puis « Me connecter » ou « Créer mon compte ».
2. Pour vous connecter, utilisez un compte existant (par exemple **alex@example.test** ou **nina@example.test**) et le code **123456**. Pour créer un compte, choisissez une nouvelle adresse fictive. Aucun e-mail n’est envoyé.
3. Renseignez vos envies : les objectifs s’adaptent à la pratique. Choisissez ensuite votre commune ou arrondissement d’Île-de-France (recherche par nom/code postal et filtre département), votre budget et votre moment préféré. L’onboarding reste facultatif.
4. Explorez, comparez, choisissez une heure et simulez la réservation.
5. Dans Séances : détail, calendrier, message, modification, annulation et historique.

Vos préférences sont modifiables dans Mon espace. « Explorer d’abord » permet aussi d’essayer sans connexion.

## Entrée coach

- « Je suis coach → Me connecter » ouvre l’agenda fictif de Thomas.
- « Je suis coach → Créer mon compte » ouvre une checklist de mise en ligne en six étapes.
- Navigation : **Agenda / Clients / Activité / Réglages**.
- Configurez offres, durées, tarifs, lieux, déplacements, semaine type, pauses, absences et règles.
- Les changements affectent les disponibilités et les nouvelles réservations ; les séances déjà payées conservent leurs conditions.
- Testez les fiches clients, notes privées, messages, annulation coach et relevé d’activité CSV.
- Documents, compte de versement et connexions de calendriers sont explicitement simulés.

## Cadre de la démo

Horloge fixe : **14 septembre 2026, 08:00, Paris**, avec 14 jours de planning. Données locales dans ce navigateur. Aucun compte réel, débit, message externe, virement ou contrôle de document. La carte, les distances et le rayon de déplacement sont schématiques.

L’export calendrier `.ics` et le relevé CSV sont de vrais fichiers téléchargeables contenant les données fictives de la démo.

Les réglages et essais sont conservés si le navigateur autorise LocalStorage. Pour tout remettre à zéro : **Mon espace client → À propos de ce prototype → Réinitialiser la démo**.

## Documents

- **MVP-etat-des-lieux.md** : inventaire des fonctionnalités testables, partielles, simulées et absentes ; priorités pour terminer le prototype et préparer un pilote réel.

- **priorite-2.md** : version actuelle, réservation suivante, transfert de groupe, annulation partielle et scénario de test.
- **priorite-1.md** : comptes client/coach, messagerie, avis et profils.
- **evolution-produit-v2.md** : historique de la réflexion produit et du benchmark complémentaire de la V2.
- **benchmark-et-conception.md** : recherche et décisions de la première version ; lire priorite-2.md pour les nouveaux parcours.
- **verification.md** : contrôles réalisés.
- **OFL-Hanken-Grotesk.txt** : licence de la police, aussi embarquée dans le HTML.

Le repository Project-H-iOS reste une référence en lecture seule. Aucun fichier, commit ou branche n’y a été créé.

## Parcours complémentaires

- **Alertes** : en bas de la recherche ou sur un profil, enregistrez un jour et une plage horaire. Retrouvez les correspondances dans « Mon espace → Mes alertes ».
- **Préparation** : dans le détail d’une séance, ouvrez « Préparer ma séance ». Côté coach, modifiez « Consignes avant la séance » dans Réglages.
- **Assistance** : dans une séance, choisissez « Un imprévu ? Demander de l’aide ». Suivez la demande dans Mon espace.
- **Équipe Partant** : « Mon espace → À propos de ce prototype → Tester l’espace équipe Partant ». Examinez une demande, répondez et simulez si nécessaire le remboursement. Cet accès est uniquement une facilité de démonstration.
- **Groupes** : côté coach, « Réglages → Séances & tarifs → Créer une séance → Groupe ». Choisissez la capacité et le prix par personne, puis « Planifier et gérer mes cours en groupe ». Un cours planifié apparaît côté client sur le profil et dans les résultats à la date correspondante.
- **Capacité** : dans Mes cours en groupe, « Gérer » permet de voir les places réservées, ajuster le maximum et annuler le cours avec remboursement intégral des inscrits.

Les données du prototype sont locales. Dans un fichier neuf, aucun groupe n’est activé par défaut : configurez puis planifiez le premier cours pour voir son effet côté client.

La priorisation complète est dans **feuille-de-route-produit.md**.

## Comptes, messages et avis

À l’accueil, « Essayer les comptes de démonstration » permet de choisir Alex, Nina ou un des six coachs. Le bouton Changer de compte est aussi disponible une fois connecté. Chaque coach conserve sa configuration. Les places disponibles sont communes aux comptes, tandis que les dossiers clients restent séparés dans les parcours.

Les conversations sont liées aux réservations et partagées entre les deux interlocuteurs de la démo, avec suivi de lecture. Les avis apparaissent sur le profil après une séance terminée ; le coach peut répondre. Les signalements se traitent dans l’espace équipe de démonstration.

Testez ces échanges dans un seul onglet. Le stockage du fichier HTML et celui de l’aperçu HTTP sont distincts ; aucun échange réel entre appareils n’est implémenté. Les anciens essais sont repris sous Alex et les anciens réglages coach sous Thomas.

## Tester une modification et son alerte

Rechargez le prototype, réservez une séance individuelle puis déplacez son créneau. Passez sur le compte du coach concerné : son agenda présente l’ancien et le nouvel horaire, et le bouton Notifications indique les événements non lus. Voir la séance ouvre le détail actualisé et marque l’alerte comme lue. Les anciennes modifications ne sont pas notifiées rétroactivement.

## Priorité 2 : revenir et ajuster ses séances

- Depuis une séance passée, **Réserver à nouveau** propose les prochains créneaux avec le coach. Chaque nouvelle séance passe par un récapitulatif et un paiement simulé explicites.
- Dans une réservation de groupe confirmée, **Changer de cours** transfère toutes les places vers un cours du même coach, avant la limite d’annulation gratuite. Le supplément ou remboursement apparaît avant confirmation.
- **Annuler certaines places** permet de garder au moins une place. Le remboursement suit les conditions réservées ; les places libérées redeviennent disponibles.
- La référence, la conversation, les montants cumulés et l’historique sont conservés. Le coach retrouve les changements dans ses notifications et son activité.

Le scénario complet et les limites sont décrits dans **priorite-2.md**.
