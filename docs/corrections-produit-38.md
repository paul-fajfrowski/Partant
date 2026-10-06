# Livraison 38 — rendre la découverte et l’activation cohérentes

6 octobre 2026. Mise en œuvre autorisée des recommandations P38-01 à P38-10 de l’[audit produit](audit-produit-adoption-2026-10-06.md). Sources communes dans `apps/mobile/src/product` : app React Native, aperçu mobile et WebApp. Le HTML de référence reste archivé.

## Changements

| Audit | Réalisation |
| --- | --- |
| P38-01 | La découverte choisit une offre de la discipline filtrée ou saisie exactement dans la recherche. Carte, prix, date, profil et accès direct au créneau portent cette même offre. En format libre, priorité à une offre individuelle admissible. |
| P38-02 | Le prix de découverte utilise `quotePrice`, y compris le supplément domicile. Budget et tri utilisent ce montant. « Dès » indique les variations selon le lieu ; duo pour deux, collectif par personne. Comparaison, favoris et profil réutilisent ces montants. Le serveur reste responsable du prix final. |
| P38-03 | « Prochainement » remplace aujourd’hui comme contrainte implicite : prochaine disponibilité dans l’horizon du coach, jusqu’à 90 jours. Une date choisie reste stricte. Les alternatives indiquent une autre date en conservant les critères, y compris le nom recherché. |
| P38-04 | Checklist et publication partagent `hasBookableOpening` : semaine, date ponctuelle et cours daté. L’attente de vérification ne devient plus une fausse tâche du coach ; corrections, expiration et suspension restent visibles. |
| P38-05 | Destinations web dans l’URL, recherche conservée, accès direct/rechargement, Retour/Avancer et flèche interne. Liens de profil copiables sur web, partage `partant://open` dans l’app installée. Paramètres validés, ressource privée contrôlée par le compte. Formulaires, secrets et écrans de paiement exclus des liens. |
| P38-06 | Un seul écran client facultatif : pratique et secteur. Budget dans les filtres, objectif facultatif au moment de préparer une réservation. Aucune question sans effet sur le premier passage, ni filtre caché hérité de l’inscription. |
| P38-07 | Dossier toujours premier ; checklist existante avec une prochaine action faisable, puis présentation, offre, lieu, planning et versements de test. Les paramètres déjà saisis sont conservés pendant la vérification. Aucune auto-validation ni nouveau compte équipe. |
| P38-08 | « Appliquer à la journée » dans l’éditeur, puis « Enregistrer les modifications ». Brouillon et sauvegarde serveur restent distincts ; protection de l’abandon conservée. |
| P38-09 | Prochaine séance ou coach à retrouver sur l’accueil client ; favoris indépendants des filtres de recherche. Comparaison secondaire dans le profil mobile. Rendez-vous extérieur et indisponibilité accessibles en haut de l’agenda. Cloche réelle ; niveau déclaré plutôt qu’une promesse universelle. Publication sans le mot démonstration en mode connecté, paiement toujours explicitement simulé. |
| P38-10 | Dates ponctuelles, indisponibilités, assistance, historique, annulations et conditions conservés. Aucun horaire, temps de trajet ou espacement imposé. |

Le statut hors ligne d’un profil déjà configuré propose la remise en ligne ; le système ne prétend pas connaître la date d’une première publication qui n’était pas enregistrée historiquement.

## Navigation et limites volontaires

Les liens portent les destinations publiques ou protégées, pas un état arbitraire complet de l’application. Un brouillon de formulaire ou un dialogue n’est pas une URL partageable. Le bouton Retour respecte ces étapes locales avant de quitter la page. Le rechargement d’un écran de paiement revient à une destination stable, sans rejouer une réservation.

Un lien `partant://` nécessite l’application installée. Les Universal Links, l’hébergement HTTPS public et le référencement des profils ne sont pas déclarés activés : le domaine reste à choisir. Les accès OAuth continuent d’utiliser leurs callbacks existants.

Le parcours client connecté garde les mêmes droits. Un lien vers les réglages coach ne transforme pas un client en coach. Un identifiant de réservation ne suffit pas pour lire la séance d’un autre compte. Le dossier demeure obligatoire avant publication.

## Vérification

**Résultats : 47/47 suites métier/DOM, 12/12 suites navigateur, 20 états UI à 320/390/820/1440 px sans débordement, erreur de page ou violation axe détectée. TypeScript, export iOS Hermes et exports web développement/production réussis ; isolation du canal production vérifiée dans le navigateur.** Pas de nouvelle recette physique.

Les résultats finaux sont dans [les preuves de livraison](audits/2026-10-06-corrections/verification.json). Les nouveaux tests `test-product-38.cjs` et `test-product-browser-38.cjs` rejoignent la recette habituelle.

Couverture ajoutée : discipline recherchée, nom sans disponibilité aujourd’hui, date explicite, supplément domicile et budget, duo, prix figé d’un cours collectif, checklist datée, suspension, routes sans jetons, navigation/rechargement, protections client/coach et ressource inconnue. Les scénarios d’inscription et les assertions de libellés ont été adaptés au nouveau parcours. Le test DOM de sélection d’heure cible désormais le bouton radio du dialogue : l’ancien sélecteur textuel pouvait cliquer un créneau de résultat portant la même heure derrière le dialogue.

Les trois fonctions partageant le domaine sont synchronisées sur le projet Supabase de développement. Aucune migration de données, habilitation réelle, activation de paiement ou modification OAuth dans cette livraison. Le contrôle public de l’API ne remplace pas une recette avec comptes réels.

## Prochaine étape : recette réelle, puis observation d’usage

Voir [la fiche de recette](recette-terrain-38.md). Les tests automatisés prouvent les scénarios exécutés ; ils ne prouvent ni la réception push sur l’iPhone, ni le consentement Calendar, ni l’adoption commerciale.

Restent ouverts : paiement marketplace ; domaine/SMTP et e-mails réellement reçus ; opérateur équipe désigné ; informations juridiques et conservation ; iPhone/Android, APNs et Calendar réels ; optimisation des photos après essais de médias iPhone ; charge/normalisation, restauration complète et surveillance opérateur. Ces sujets ont besoin d’une décision, d’un environnement ou d’une validation spécifique. Ils ne sont pas assimilés à de simples finitions UI et ne sont pas présentés comme terminés.
