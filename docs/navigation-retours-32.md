# Retours de navigation — livraison 32

## Problème et correction

La flèche connaissait les écrans, mais pas certaines étapes à l’intérieur d’un écran. Dans Disponibilités, revenir depuis lundi quittait ainsi toute la configuration.

Une pile locale partagée complète désormais l’historique des écrans. Le retour traite une seule étape : fenêtre imbriquée, fenêtre principale, confirmation, étape locale, puis écran précédent. Les gestionnaires sont retirés au démontage. Aucun nouvel horaire ni écriture métier ne sont ajoutés par un retour.

- Disponibilités : journée → semaine → origine réelle (Agenda ou Réglages). Sur un grand écran où semaine et journée restent côte à côte, la semaine est déjà accessible ; la flèche revient à l’origine.
- Édition d’une plage : offres/lieux → horaires ; confirmation de retrait ou d’abandon → édition. Une saisie non appliquée conserve la confirmation d’abandon existante. Les modifications appliquées à une journée restent dans le brouillon pendant les allers-retours ; enregistrer reste explicite.
- Copie : confirmation du remplacement → choix des jours → journée.
- Consultation agenda : liste de toutes les plages → fiche → liste. Une fiche ouverte directement revient à l’agenda.
- Suppression de compte, annulation coach, retrait de lieu/date/document, déconnexion d’agenda et abandon de brouillon : le premier retour referme la confirmation, sans valider l’action.
- Répétition de cours : retour depuis l’aperçu vers sa préparation.
- Dialogues communs : priorité à la fenêtre au premier plan. Échap web et demande de fermeture native utilisent le même callback. Les dialogues à étapes proposent une flèche dédiée ; la croix conserve la fermeture du dialogue.

## Audit des familles d’écrans

| Famille | Règle examinée |
| --- | --- |
| Accueil, connexion, création, code, compte incomplet | Origine conservée et sortie accessible ; inscription incomplète explicitement abandonnée |
| Onboarding / préférences | Étape précédente, puis écran ayant ouvert les préférences |
| Exploration, filtres, tri, carte, favoris, profil coach | Fenêtre au premier plan avant le profil ou la liste ; filtres et accordéons ne deviennent pas des pages artificielles |
| Créneau, préparation, récapitulatif, confirmation, détail de séance | Historique cohérent ; jamais de retour au paiement après confirmation |
| Modification, propositions, transfert, récurrence, avis, préparation de séance | Historique de réservation existant conservé ; confirmation locale avant retour de page |
| Messages / conversation / notifications / détail | Retour à la liste d’origine ; chapitre de notifications conservé |
| Compte client, demandes, signalements, confidentialité et suppression | Retour à l’espace client ; confirmation de suppression refermée en premier |
| Agenda coach, clients, activité, séances et groupes | Onglet et date d’origine conservés ; annulations locales refermées en premier |
| Profil, offres, lieux, semaine, dates, règles, agendas, préparation, documents, versements, notifications coach | Retour à la rubrique ou son origine ; sous-étapes explicites traitées avant l’historique global |
| Dossier coach et espace équipe | Éditeur de document refermé avant navigation ; accordéons et inspecteurs inline restent des éléments de leur page |
| Outils de démonstration | Séparation des espaces et sorties existantes conservées |

Cet inventaire est un audit de code et de parcours. Tous les états métier et toutes les combinaisons d’écrans ne sont pas pour autant couverts par un test automatique.

## Vérifications exécutées

- `test-back-layers-32.cjs` : **100 contrôles**, dont priorité/nettoyage des couches, semaine/jour, offres/lieux, copie, abandon/retrait, brouillon conservé, fiche d’agenda, neuf rubriques coach, compte/checklist/préparation, suppression de compte, annulation coach, filtres imbriqués et retours de l’espace client. Chromium à 390, 1280 et 1440 px ; données fictives locales uniquement.
- `test-availability-editor-31.cjs` : **78 contrôles** de non-régression de l’éditeur.
- `test-range-browser-29.cjs` : **20 contrôles** des fiches de disponibilités.
- `test-native-navigation-web.cjs` : **28 contrôles DOM** des parcours partagés.
- `test-navigation-exits-20.cjs` : **29 client, 19 coach, 16 compte incomplet, 9 réservation** ; API simulée pour les scénarios connectés.
- Notifications : **20 contrôles client et 9 coach**, retour au chapitre et destination correcte. Deux anciens libellés attendus ont été alignés sur les écrans déjà livrés (rappels de séance et dossier coach).
- TypeScript et export web + bundle iOS Hermes : réussis.
- Revue du dialogue en largeur mobile : flèche et croix distinctes, horaires et actions lisibles.

Total : **328 contrôles réussis**. Les tests navigateur/DOM ne constituent pas une validation sur iPhone ou Android physique. Le bouton système Android est raccordé au même mécanisme ; sa recette sur appareil reste à faire. L’historique du navigateur et un geste iOS interactif ne sont pas ajoutés par cette livraison.

## Livraison

Source partagée React Native dans `apps/mobile`, utilisée aussi par la WebApp. Aucun changement de schéma, de fonction serveur, d’authentification, de comptes ou de données connectées. Le projet iOS conserve sa configuration de compilation ; il faut recompiler depuis Xcode pour tester ces changements sur l’iPhone.
