# Partant — cohérence des parcours, version 6

Le prototype HTML validé reste archivé. Toutes les évolutions ci-dessous sont intégrées à l’application React Native, avec la même direction monochrome, Hanken Grotesk, photos, boutons arrondis et navigation principale.

## Livré dans la simulation locale

| Besoin | Réalisation | Où tester |
| --- | --- | --- |
| Préserver les modifications | Brouillons de configuration par coach et rubrique, conservés dans le stockage local ; application explicite des réglages ; abandon confirmé | Coach → Réglages |
| Retour cohérent | Historique conservant la rubrique, le coach, la date, la prestation et la réservation ; onglets sans accumulation de retours ; sortie de duplication sans réouvrir le formulaire validé | Réglages → Disponibilités → Séances et retour |
| Modifier une exception sans la perdre | Ouverture en édition ; suppression distincte avec confirmation et explication du retour aux horaires habituels | Disponibilités → Exceptions datées |
| Réutiliser son planning | Copier les plages et leurs prestations vers plusieurs jours, avec confirmation du remplacement ; la semaine se répète, les exceptions restent prioritaires | Disponibilités → Copier cette journée |
| Lieux autorisés par prestation | Choix parmi les lieux configurés du coach ; filtrage et validation de réservation ; nouveaux cours conservent leur format | Séances & tarifs → Modifier |
| Réservation plus courte | Prestation choisie conservée, changement sous « Modifier » ; lieux autorisés uniquement ; objectif facultatif | Client → Profil → créneau |
| Disponibilités visibles | Prochain créneau proposé près du nom sur le profil | Profil coach |
| Recherche vide utile | Jusqu’à deux dates alternatives dans les sept jours suivants en gardant les filtres ; autres heures, visio ou alerte selon le contexte | Explorer |
| Comprendre son agenda | Diagnostic d’une heure : publication, dossier, horizon, délai, plage, prestation, cadence, occupation, pause ou capacité | Agenda → Pourquoi une heure n’est-elle pas disponible ? |
| Rendez-vous pris directement | Saisie client, prestation, jour, heure et lieu ; conflits contrôlés ; présence dans Agenda et Clients ; annulation explicite ; exclus du chiffre d’affaires Partant | Agenda → Rendez-vous pris directement |
| Répéter les cours collectifs | Dates choisies ou cinq semaines, retraits possibles, heure libre, récapitulatif et vérification atomique ; douze dates maximum par opération | Cours → Dupliquer ou répéter |
| Capacité et inscrits | Places restantes et réservées ; prénoms facultatifs ; conservation des noms lors de transfert, retrait des derniers noms lors d’annulation partielle ; libération des places | Réservation de groupe puis gestion du cours |
| Agenda collectif | Cours affichés même sans inscrit, compteur d’occupations distinguant les cours et les réservations individuelles | Agenda |
| Mise en ligne guidée | Six étapes avec statut réel, prochaine action et prévisualisation ; raccourci pour les coachs non publiés | Agenda / checklist |
| Réglages mieux structurés | Mon offre, Mon organisation, Mon compte professionnel ; préparation avec l’organisation, versements accessibles depuis Activité | Réglages / Activité |
| Conséquences des changements | Ancienne et nouvelle date avant confirmation ; prix conservé ; montant du remboursement et délai avant annulation | Séance → Modifier / Annuler |
| Ergonomie des formulaires | Sauvegarde fixe sur planning/règles/préparation/notifications ; erreurs d’heure après sortie de champ ; gestion d’espace clavier iOS | Configuration sur téléphone |

Une séance directe peut être enregistrée hors plages publiques, à une heure choisie par le coach, mais ne peut chevaucher une réservation, un cours, une indisponibilité ou une pause. Son prix est informatif ; aucun paiement, commission ou message Partant n’est produit.

Les nouveaux cours utilisent les paramètres actuels de l’offre. Les cours existants conservent leurs tarifs, capacités et conditions. Une duplication conflictuelle n’enregistre aucune des nouvelles dates. Elle ne transfère aucun participant et ne crée aucun abonnement client.

Les prénoms de groupe sont facultatifs. La personne qui réserve reste l’unique interlocuteur. En cas d’annulation partielle, la liste conserve les premiers participants ; aucun nouveau compte n’est créé pour les accompagnants.

## État des branchements

| Niveau | État |
| --- | --- |
| Application locale | Les parcours ci-dessus sont testables avec les comptes fictifs ; données sur cet appareil |
| Socle serveur existant | Le mode connecté dispose des opérations déjà documentées dans `branchements.md` ; cette livraison n’en modifie pas le schéma |
| Règles avancées | Lieux par offre, nouveaux brouillons, rendez-vous directs et séries de cours restent à persister et valider côté serveur, avec droits et transactions |
| Intégrations 1–3 | Authentification fournisseurs, géographie réelle et agendas externes restent à terminer selon les comptes développeurs disponibles |
| Paiements / communications externes | Étapes 4 et 5 toujours différées ; aucun encaissement, SMS ou push ajouté |
| Validation visuelle mobile | À faire sur appareil ; export natif et tests DOM ne valident ni les gestes ni les pixels |

## Recette à effectuer sur téléphone

1. Modifier une heure, ouvrir une autre rubrique et revenir. Retrouver le brouillon, l’enregistrer, puis retrouver le résultat côté client.
2. Fermer une date, ouvrir l’exception, annuler sa suppression puis la supprimer réellement.
3. Copier un jour sur deux autres jours. Vérifier les offres associées et les exceptions.
4. Limiter une prestation au studio ; vérifier la recherche, le lieu choisi et le prix au checkout.
5. Ajouter un rendez-vous direct : vérifier sa présence coach et l’absence du créneau client, puis sa libération après annulation.
6. Dupliquer un cours avec trois dates dont une conflictuelle ; vérifier l’absence de création partielle. Retirer le conflit et confirmer.
7. Réserver trois places avec des prénoms, retrouver les inscrits puis annuler une place. Contrôler les compteurs client et coach.
8. Modifier une séance : lire le récapitulatif avant confirmation, vérifier la notification coach. Annuler et comparer le montant annoncé à l’historique.
9. Rejouer avec clavier ouvert, grand texte, retour Android, 390 et 430 px. Vérifier que les actions restent accessibles et qu’aucun bouton n’est masqué.

Tests automatisés ajoutés : `scripts/test-native-product-polish.cjs` (règles métier) et `scripts/test-native-product-polish-web.cjs` (parcours DOM). Les suites existantes doivent également passer.

## Validation automatisée de cette livraison

260 assertions passent : 153 métier et 107 DOM sur les neuf suites. Contrôle TypeScript et exports web/iOS/Android réussis. La référence HTML conserve son empreinte SHA-256. Les tests DOM ne constituent pas une validation visuelle ni une recette sur téléphone.
