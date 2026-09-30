# Corrections des fonctionnalités Partant

Livraison du 30 septembre 2026, après l’audit fonctionnel du commit `6869b07`. Les six points F-01 à F-06 sont corrigés dans la source commune React Native et WebApp et dans le serveur de développement. Cette livraison ne transforme pas les paiements simulés en paiements réels et ne vaut pas validation du dernier binaire sur iPhone.

## Changements livrés

| Point | Comportement corrigé | Contrôle principal |
| --- | --- | --- |
| F-01 Suspension | L’équipe suspend avec un motif et un historique. Le coach ne peut ni effacer la suspension ni republier. Les nouveaux créneaux sont fermés ; les rendez-vous existants restent accessibles. Une levée motivée par l’équipe autorise une republication volontaire. | Droits vérifiés par l’API, y compris pour les appels directs. |
| F-02 Domicile | Le coach choisit un centre public de déplacement et son rayon. L’adresse client est vérifiée avant confirmation, y compris lors d’une modification ou d’une proposition. | Géocodage IGN côté serveur ; coordonnées client ignorées. Hors zone, adresse ambiguë ou service indisponible : refus explicite, saisie conservée. |
| F-03 Dates ponctuelles | Un coach peut publier sans semaine récurrente lorsqu’une offre possède un départ réellement réservable sur une date future. | Le même moteur tient compte de la durée, du préavis, des lieux, des droits de pratique et des occupations. Une plage passée ou trop courte ne suffit pas. |
| F-04 Alertes duo | Deux participants peuvent recevoir une disponibilité duo. Le budget porte sur le total, supplément de déplacement compris. | Le résultat conserve l’offre, le lieu et le nombre de participants lors de l’ouverture de la réservation. |
| F-05 Alertes locales | Une alerte globale pour une séance physique demande un secteur et un rayon. Les résultats non localisables ne sont pas supposés proches. La visio reste indépendante de la distance. | Centre résolu côté serveur ; les anciennes alertes sans secteur invitent à en créer une locale. Les alertes ne réservent pas automatiquement. |
| F-06 Candidature coach | L’équipe autorise ou refuse la candidature. Après autorisation, le client confirme lui-même son passage professionnel et complète un nouveau dossier. | Pas de bascule libre, pas de validation automatique du dossier. Les séances client à venir doivent être terminées ou annulées. Historique et conversations conservés. |

Les confirmations des nouvelles actions attendent l’accusé serveur. Une erreur ne doit pas être présentée comme un enregistrement réussi. Le filtrage de découverte exclut aussi une distance inconnue plutôt que de la considérer compatible avec le rayon choisi.

## Conséquences pratiques

- Le centre de déplacement est un repère public, par exemple une place ou un quartier. L’interface demande de ne pas y saisir une adresse privée. Le rayon représente une distance géographique, pas un temps de trajet routier.
- Un lieu physique doit posséder des coordonnées pour participer à la découverte par distance et aux alertes locales. Les lieux saisis sans géocodage doivent être complétés avec les suggestions.
- Une suspension ne supprime aucune réservation ni aucun message. Les éventuelles annulations de rendez-vous existants demandent un traitement distinct.
- La levée de suspension est accessible dans l’espace équipe, avec motif obligatoire. L’historique conserve l’auteur et la date.
- Après passage coach, le compte garde l’accès à « Mes anciennes séances client ». Le nouveau profil reste non publié et le dossier à compléter ; l’accord de candidature ne remplace pas la vérification des qualifications.

## Recette et preuves

Les résultats consolidés et captures sont enregistrés dans [le dossier de preuves](audits/2026-09-30-features35/verification.json).

- Recette métier et DOM : 43 suites au total. La première passe donne 42/43 ; le test des lieux cherchait l’ancien intitulé « Secteur de déplacement ». Son sélecteur a été adapté au champ « Centre de votre zone de déplacement » et ses 13 contrôles repassent. Aucun contrôle métier n’a été retiré.
- Nouvelle suite fonctionnelle : 57 contrôles couvrant les six points, les droits, l’historique, le budget, les données géographiques falsifiées, une adresse ambiguë et l’indisponibilité du géocodeur.
- Recette navigateur Chromium : 10 suites, dont le passage client vers dossier coach aux largeurs 390 et 1440 px. Les 10 contrôles de ce nouveau parcours incluent absence de débordement, absence d’exception et contrôle axe du dossier. Le sélecteur du test des notifications attend désormais la fin du chargement et tient compte du nombre de non-lus dans le nom accessible.
- Serveur Supabase : 36 contrôles existants API/Auth/concurrence/confidentialité/Storage et 20 contrôles supplémentaires exécutés sur des comptes QA temporaires. Une réservation Paris → Lyon hors zone et sa modification sont refusées ; une adresse proche est acceptée. Suspension, droits équipe et conversion approuvée sont vérifiés.
- TypeScript, export WebApp et export iOS Hermes réussis. Le bundle web principal est identique entre les sorties `apps/mobile/dist` et `apps/web/dist` : `index-261f634a5c90a885588f90129293e549.js`.
- Les trois fonctions partageant le domaine sont actives : `product-api` version 23, `google-calendar` version 18, `push-dispatch` version 11. Aucun paiement ni service payant activé.
- Nettoyage QA effectué ; contrôle serveur final : zéro utilisateur `partant-qa-…@example.invalid` restant.

Ces contrôles ne sont pas une recette physique iPhone, une vérification VoiceOver, un test de charge ou un essai réel Google Calendar/APNs. Les premières tentatives navigateur sans URL de test configurée ont été écartées puis rejouées avec la bonne configuration ; seuls les résultats de la dernière passe sont retenus.

## Reproduire localement

Depuis la racine du dépôt, avec Node 24 et les dépendances installées :

```sh
npm --prefix apps/mobile run typecheck
node scripts/qa-33.cjs
npm --prefix apps/web run build
```

Pour les tests Chromium, servir le dernier export sur le port 8081 puis définir `PARTANT_QA_URL=http://127.0.0.1:8081` et, si nécessaire, `PARTANT_QA_CHROME` avec le chemin de Chrome. Lancer `node scripts/qa-33.cjs --browser`.

La recette API utilise des identités temporaires préparées par le mécanisme existant `test-connected-api.mjs --prepare`. Elle nécessite les droits opérateur et un nettoyage ensuite ; ne pas l’exécuter sur des comptes clients ni déposer ses fichiers temporaires dans Git.

Le script historique `audit-features-35.cjs` reproduisait volontairement les défauts avant correction. La suite de non-régression est désormais `test-features-35.cjs`.

## Prochaines validations

1. Désigner explicitement l’adresse du compte équipe à habiliter. Aucun compte réel n’a été promu par supposition ; le serveur comporte toujours zéro opérateur permanent à ce stade.
2. Récupérer les sources puis recompiler avec `Ouvrir Partant.command`. Le workspace et le schéma existants restent ceux de l’application connectée. Un binaire déjà installé n’est pas mis à jour par Git.
3. Dérouler client iPhone / coach WebApp : adresse à domicile, réservation duo issue d’une alerte, publication sur date ponctuelle, dossier et retours de navigation.
4. Valider la réception APNs et la synchronisation Google Calendar avec les comptes et appareils réels.

Paiement, expéditeur e-mail personnalisé, Outlook et préparation commerciale restent dans le [suivi MVP](../ETAT_DU_PROJET.md). Aucune habilitation légale ou conformité complète n’est déclarée par cette livraison.
