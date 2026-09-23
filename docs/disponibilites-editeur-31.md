# Configuration des disponibilités — livraison 31

## Organisation

La semaine habituelle présente sept résumés (nombre de plages et amplitude explicitement distinguée des heures ouvertes). Sur mobile, choisir un jour remplace la liste par le détail de cette journée avec « Retour à la semaine ». Sur grand écran (à partir de 1 360 px), la semaine reste à gauche et la journée s’ouvre à droite. Sur un espace ordinateur plus étroit, la navigation jour par jour évite de comprimer les champs entre les deux menus latéraux.

Les plages sont affichées par ordre horaire, sous forme de lignes : horaire, séances et lieux. Un seul éditeur s’ouvre à la fois. Il permet de saisir le début/la fin, de choisir les offres et les lieux, et de consulter un aperçu facultatif des départs. Les horaires restent entièrement choisis par le coach. Aucune cadence imposée, pause ou espacement ajouté.

- Chevauchement, format invalide et fin avant début : message immédiat, application impossible tant que l’erreur persiste. `validateIntervals` reste l’autorité de validation lors de l’application puis de l’enregistrement.
- Dupliquer une plage conserve offres et lieux, mais demande de nouveaux horaires.
- Retirer une plage demande confirmation ; aucune réservation existante n’est annulée.
- Fermer une plage modifiée propose de poursuivre ou d’abandonner la saisie locale.
- Copier un jour est une action secondaire : destinations, confirmation de remplacement, puis enregistrement explicite de la semaine.
- « Appliquer à la journée » modifie le brouillon ; le bouton fixe « Enregistrer les modifications » utilise le mécanisme existant avec confirmation après serveur. Pas de faux accusé d’enregistrement ajouté.
- Le même éditeur compact sert aux modifications d’une seule date. Les horaires habituels ne sont pas modifiés dans ce parcours.

Aucune modification de schéma, RLS ou règles de disponibilité côté serveur. Source partagée native/web ; prototype HTML archivé inchangé.

## Correction du scénario fictif

La recette a découvert un délai de réservation nul dans le coach fictif de la livraison 30, incompatible avec la validation existante (au moins une heure). Le scénario utilise désormais deux heures. Une reprise limitée à la clé `partant-native-recette-coach-realiste-30` corrige seulement cette valeur nulle dans la simulation déjà enregistrée. Aucun réglage connecté n’est modifié.

## Vérifications

Les résultats sont ajoutés après exécution. Les tests navigateur et exports iOS/Hermes ne remplacent pas une recette du clavier et des gestes sur iPhone physique.

- TypeScript : passe.
- Chromium : 78 contrôles à 390, 1 280 et 1 440 px, couvrant la semaine, la journée, la saisie, le chevauchement, l’abandon, la duplication, la copie confirmée, le retrait, la sauvegarde et la conservation des réservations.
- Parcours fiche de disponibilité → modification de la date : 20 contrôles de non-régression.
- WebApp : 45 contrôles de non-régression.
- Exports web et iOS/Hermes : réussis. Nouveau build Xcode signé et clavier iPhone à vérifier sur appareil.
- Captures locales : `/private/tmp/partant-availability-31`.
