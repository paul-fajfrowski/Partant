# Partant — audit produit, parcours et potentiel d’adoption

**6 octobre 2026 · sources auditées : `87f0a46` · audit, aucune correction produit appliquée.**

> Mise à jour après audit : les corrections et simplifications P38-01 à P38-10 sont suivies dans la [livraison 38](corrections-produit-38.md). Les constats et captures ci-dessous restent ceux du code avant correction.

## Avis sincère

Partant a une proposition compréhensible et utile : trouver une personne adaptée, connaître ses vraies disponibilités, réserver sans échange préalable obligatoire. La direction visuelle est cohérente ; l’app et la WebApp ont une identité commune. Les parcours développés vont beaucoup plus loin qu’une simple vitrine.

Le périmètre client est suffisant pour éprouver le concept. Le coach dispose déjà de l’essentiel pour organiser ses rendez-vous. **La priorité n’est pas d’accumuler des fonctions, mais de rendre leurs relations évidentes et leurs résultats fiables.** La promesse de centraliser toute l’activité professionnelle reste plus large que ce que le produit délivre aujourd’hui : les paiements ne sont pas réels, les agendas externes et push demandent une recette effective, les trajets ne sont pas calculés et l’exploitation humaine reste à installer.

Une adoption importante est possible, mais aucune probabilité crédible ni comparaison d’échelle avec Planity ne peut être déduite des écrans et du code. Il manque surtout des preuves d’usage : coachs qui ouvrent des disponibilités régulièrement, clients qui réservent puis reviennent, gain de temps observé, économie viable pour les deux parties.

## Portée et preuves

Cette revue couvre transversalement le produit client, le produit coach, l’équipe, le web, le mobile, les données, la sécurité, les intégrations, la distribution et l’exploitation. Elle croise le code des parcours communs, les documents des livraisons 19–37, les suites existantes, des captures actuelles et des scénarios exploratoires nouveaux. **Ce n’est pas une certification de 100 % des chemins possibles ni une nouvelle recette physique iPhone.**

Contrôles exécutés aujourd’hui :

- TypeScript et nouvel export web des sources courantes : réussis.
- **46/46 suites métier/DOM et 11/11 suites navigateur : réussies.** Les fournisseurs externes sont simulés dans les tests concernés ; les données sont fictives et isolées.
- Audit automatique de **20 états à 320, 390, 820 et 1440 px** : aucun débordement horizontal, aucune violation axe dans les règles exécutées, aucune erreur de page relevée. Revue visuelle de captures représentatives : découverte, agenda, dossier, éditeur de plage, confirmation.
- **Cinq problèmes ou limites reproduits spécifiquement** ci-dessous, non détectés par les suites existantes. Des tests verts ne signifient donc pas une expérience sans défaut.
- Premier lancement navigateur impossible car le Chromium attendu par Playwright était absent. Relance complète avec Google Chrome déjà installé : 11/11. Ce premier échec était un problème d’environnement, pas un défaut produit.

Preuves : [synthèse](audits/2026-10-06-produit/verification.json), [métier/DOM](audits/2026-10-06-produit/unit-dom.json), [navigateur](audits/2026-10-06-produit/browser.json), [audit UI](audits/2026-10-06-produit/ui-audit.json), [reproductions ciblées](audits/2026-10-06-produit/probes.json).

Non exécutés : build signé et gestes iPhone, Android, paiement, réception APNs, OAuth/Calendar réel, charge, intrusion, restauration complète, étude avec utilisateurs. La dernière recette privée API/Auth/Storage reste celle du 4 octobre : ses résultats ne sont pas présentés comme rejoués le 6. Les consoles et la base distante n’ont pas été modifiées. Aucun compte réel utilisé pour les simulations.

## Ce que le benchmark apporte réellement

Les pages publiques ont été relues le 6 octobre ; il ne s’agit pas d’un essai de comptes professionnels concurrents.

- **Planity** associe prise de rendez-vous, organisation de l’agenda, rappels et gestion des annulations. Le principe utile pour Partant est d’apporter une valeur quotidienne au professionnel, même avant une nouvelle acquisition. Il n’est pas nécessaire d’en reproduire la caisse, les stocks ou l’architecture. [Source officielle](https://info.planity.com/solution/agenda-en-ligne).
- **TrainMe** décrit une réservation directe ou un échange préalable avec le coach. Partant peut conserver la réservation directe comme chemin principal et répondre aux questions par un contenu de profil plus précis ; une conversation obligatoire ralentirait cette promesse. [FAQ officielle](https://trainme.co/fr/faq-clients-individuels).
- **ClassPass** met en avant la recherche par localisation, horaire et type d’activité. Partant a intérêt à garder cette souplesse sans introduire maintenant un système de crédits. [Présentation officielle](https://blog.classpass.com/what-is-classpass-and-how-does-it-work/).

Mon interprétation : la disponibilité fiable est un avantage seulement si elle correspond au bon sport, au bon lieu et au prix annoncé. La confiance dans ces trois informations compte davantage qu’un écran supplémentaire.

## Ce qui mérite d’être conservé

| Domaine | Acquis utiles | Décision recommandée |
| --- | --- | --- |
| Identité | Monochrome, photographie, Hanken Grotesk, boutons pilules, hiérarchie marquée | Conserver. Pas de nouvelle DA ni de multiplication des couleurs/cartes. |
| Découverte | Localisation choisie, liste/carte, sport, filtres temporels, tarifs et créneaux visibles | Conserver, corriger la pertinence et distinguer découverte libre/date demandée. |
| Réservation | Offre/date/lieu, récapitulatif, règles d’annulation, confirmation | Conserver une action principale par étape. Ne pas ajouter un questionnaire obligatoire. |
| Exploration sans compte | Consultation avant authentification, reprise de l’intention | Conserver. Un compte créé n’est pas une preuve de valeur ; une réservation aboutie l’est davantage. |
| Formats | Individuel, duo, collectif avec capacité | Conserver ; l’individuel reste le chemin le plus direct pour la promesse de coach privé. |
| Retours | Séances, modification, annulation, réservation à nouveau, favoris | Conserver et rendre la prochaine séance/le coach habituel prioritaires pour les clients récurrents. |
| Messages | Conversation par personne et accès aux séances associées | Conserver ; aucun retour à un fil séparé pour chaque réservation. |
| Notifications | Rubriques bornées, dates, actions distinctes des non-lus, messages séparés | Conserver. Les préférences de push « messages » restent utiles même si la boîte Notifications les exclut. |
| Planning coach | Horaires choisis, semaine → jour → plage, copie, dates ponctuelles | Conserver. Ne pas réintroduire une cadence, des pauses ou un espacement imposés. |
| Agenda | Rendez-vous avant disponibilités, vue semaine desktop, jour mobile, détails au clic | Conserver, raccourcir seulement les éléments secondaires. |
| Dossier | Tronc commun, justificatifs adaptés, réutilisation, statut par pratique | Conserver le dossier initial et les contrôles avant publication ; simplifier la saisie, pas les exigences. |
| Équipe | Rôles privés, MFA, dossiers attribués, décisions et historique | Acquis techniques ; installer l’exploitation avec un opérateur réel autorisé. |

## Corrections démontrées avant le prochain pilote

P1 signifie ici « avant un pilote élargi du parcours concerné », pas une vulnérabilité critique de sécurité.

### P38-01 — Le sport filtré ne sélectionne pas nécessairement la bonne offre · P1

**Reproduit dans l’interface.** Un coach propose Musculation et Running, toutes deux autorisées dans la fixture. Après sélection de Running, sa carte affiche « Musculation audit ». Le filtre porte sur les disciplines du coach ; `primary()` sélectionne l’offre selon disponibilité/prix/format sans appliquer la discipline choisie. Ce n’est pas une preuve de contournement des droits de qualification, mais une erreur de correspondance commerciale.

Références : [ProductApp.tsx](../apps/mobile/src/product/ProductApp.tsx), fonctions `primary`, `results`, `card`. [Capture](audits/2026-10-06-produit/search-discipline.png).

**Correction attendue :** sélectionner une offre correspondant à la pratique recherchée, puis utiliser cette même offre pour le prix, les heures, la carte, le profil et la réservation. Une séance d’une autre pratique ne doit pas être présentée comme un résultat exact.

**Recette :** coach avec deux disciplines, durées/tarifs/lieux distincts ; recherche sportive, textuelle et créneau direct ; pas de substitution silencieuse.

### P38-02 — Le prix de découverte peut exclure le déplacement · P1

**Reproduit dans l’interface et le moteur.** Budget maximum 50 €, lieu Domicile, prestation 50 € et déplacement 20 € : le coach apparaît à 50 € avec « Tout compris », alors que `quotePrice()` calcule 70 €. Le filtre et le tri utilisent le prix de base de l’offre. La différence avant confirmation peut entamer la confiance même si le montant final est ensuite calculé correctement.

Références : `ProductApp.tsx` (`primary`, `results`, `card`) et [model.ts](../apps/mobile/src/product/model.ts), `quotePrice`. [Capture](audits/2026-10-06-produit/search-price-home.png).

**Correction attendue :** prix effectif pour le format choisi ; « À partir de » si le lieu n’est pas encore décidé et fait varier le total ; budget et tri basés sur le même montant. Supprimer « Tout compris » quand il ne peut pas être garanti. Prix duo pour deux et prix groupe par personne toujours explicites.

**Recette :** domicile avec/sans frais, studio, duo, groupe et plusieurs participants ; même base de prix de la recherche à la confirmation, montant final revalidé serveur.

### P38-03 — Chercher une personne dépend implicitement d’aujourd’hui · P1

**Reproduit.** Thomas n’a rien aujourd’hui, mais possède des créneaux demain. Rechercher son nom exact affiche « Aucun résultat ». L’état initial sélectionne aujourd’hui et `results` impose une disponibilité ce jour-là. Les alternatives aux jours suivants existent déjà, mais elles sont conditionnées à une recherche textuelle vide et à un secteur commençant par Paris.

Référence : `ProductApp.tsx`, état `day`, `results` et état vide d’Explorer. [Capture](audits/2026-10-06-produit/search-person-day.png).

**Correction attendue :** en découverte libre ou recherche nominative, montrer le coach et son prochain créneau. Une date explicitement demandée doit rester stricte ; proposer d’autres dates dans une zone clairement identifiée, sans mélanger les résultats. Ne pas conditionner cette aide au mot Paris.

Pas besoin de deux nouvelles pages : un état initial « Prochaines disponibilités » et les raccourcis temporels actuels peuvent suffire. À tester auprès d’utilisateurs avant de figer le libellé.

### P38-04 — La checklist contredit la possibilité de publier · P1

**Reproduit au niveau métier.** Semaine vide et date ponctuelle future réservable : `publicationIssues()` ne signale aucun blocage, mais `setupSteps()` indique « Ouvrez votre planning » non terminé parce qu’il ne regarde que la semaine. Un coach peut chercher inutilement à corriger un dossier déjà publiable.

Références : [agendaTools.ts](../apps/mobile/src/product/agendaTools.ts), `setupSteps`, et [workflows.ts](../apps/mobile/src/product/workflows.ts), `publicationIssues`.

**Correction attendue :** une seule définition du prérequis de planning ; distinguer « à compléter », « envoyé/en vérification », « validé », « en pause » et « suspendu ». La checklist doit indiquer la prochaine action réellement faisable par le coach, sans lui demander de réaliser une décision qui appartient à l’équipe.

**Recette :** semaine, date ponctuelle, cours collectif seul, dossier en attente/correction/validation, suspension ; pas de contradiction entre statut, bouton et serveur.

### P38-05 — Le profil web n’a pas d’adresse de navigation propre · P1 web

**Reproduit dans le navigateur.** Ouvrir un profil ne change pas l’URL ; recharger ramène à Explorer. La navigation produit utilise un historique en mémoire. Les retours internes ont été améliorés, mais ne constituent pas un routage web complet.

Référence : `ProductApp.tsx`, `screen`, `go` et historique local ; [navigation.ts](../apps/mobile/src/product/navigation.ts).

**Correction attendue :** routes stables pour profil, recherche et écrans utiles ; Retour/Avancer/rechargement cohérents ; lien d’un coach partageable qui conserve le contexte jusqu’à la réservation. Séances et dossiers privés restent soumis à l’authentification et aux droits, sans données sensibles dans l’URL. Relier ensuite les liens natifs au même identifiant de destination.

**Recette :** accès direct, rechargement, nouvel onglet, retour système/navigateur, déconnexion et ressource interdite. Cette amélioration aide autant l’usage professionnel que l’acquisition par bouche-à-oreille.

## Simplifications recommandées — constat de code et jugement produit

Ces propositions ne sont pas des résultats d’une étude utilisateurs et ne sont pas encore appliquées.

### P38-06 — Raccourcir l’onboarding client · P2

L’onboarding affiche trois étapes et huit choix : pratique, objectif, niveau, secteur, budget, distance, lieu, moment. Il est déjà possible de le passer. Le classement utilise pratique/budget/lieu/distance ; l’objectif préremplit la séance. Le niveau et le moment ne sont pas utilisés par ce classement dans le code examiné.

**Recommandation :** pratique et secteur en entrée facultative, recherche utilisable immédiatement ; budget dans les filtres ; objectif à la première réservation si utile. Retirer du premier passage les questions sans effet concret plutôt que promettre une personnalisation fictive. Garder des préférences modifiables, sans les transformer en filtres invisibles persistants. Ne pas recréer un onboarding pour le client régulier.

### P38-07 — Un parcours d’activation coach guidé, puis des réglages libres · P2

L’app possède déjà une checklist et des rubriques regroupées. Il faut les aligner, pas construire un second assistant en doublon. Le coach commence toujours par son dossier conformément à la décision validée. La suite doit proposer une prochaine action unique : première offre, lieu, disponibilités, aperçu public et publication quand les prérequis sont satisfaits. La validation par l’équipe ne doit pas obliger à ressaisir la configuration.

**Simplifier :** montrer les options propres aux groupes seulement après choix Groupe ; conserver les règles avancées, calendriers et consignes dans leurs rubriques. Pour l’écran de première mise en ligne, ne pas afficher toutes les options comme des obligations. Une séance, un lieu et quelques horaires doivent suffire au début.

### P38-08 — Clarifier la différence entre brouillon et enregistrement · P2

L’éditeur de plage fait « Valider cette plage », puis la semaine possède « Enregistrer les modifications ». La distinction est déjà expliquée ; elle reste un effort de compréhension. [Capture actuelle](audits/2026-10-06-produit/coach-editor-1440.png).

**Recommandation :** dans la fenêtre, « Ajouter au planning »/« Appliquer à la journée » ; sur la semaine, une seule action « Enregistrer les modifications », un état discret tant qu’elles ne sont pas envoyées, puis succès après accusé serveur. Conserver les brouillons et la confirmation d’abandon. Une sauvegarde automatique de chaque frappe serait risquée pour une modification de plusieurs plages : ne pas la généraliser.

### P38-09 — Réduire les sollicitations secondaires · P2

- Comparaison : elle existe. La rendre secondaire par rapport au créneau et au favori ; mesurer son utilité avant de la supprimer. Le choix d’un coach peut justifier la comparaison, mais pas une invitation permanente sur chaque carte mobile.
- Accueil client récurrent : privilégier séance à venir et « Réserver à nouveau » avec le coach habituel ; conserver la découverte en dessous. Réutiliser les fonctions existantes.
- Agenda : rapprocher « rendez-vous pris directement » et « indisponibilité » des actions principales ; ne pas imposer aux coachs de reconstruire leur carnet client pour bloquer un rendez-vous extérieur.
- Profil public : ne pas afficher systématiquement « Tous niveaux bienvenus » si l’offre est ciblée. Le groupe possède déjà un niveau ; le contenu public doit refléter le choix effectif du coach.
- Icônes : la cloche mobile tombe sur l’icône générique de quatre carrés (`ui.tsx` utilise le pictogramme `all` si absent), alors que le desktop dessine une cloche. Harmoniser ce petit détail. [Capture](audits/2026-10-06-produit/coach-agenda-390.png).
- Retirer les formulations de démonstration des futurs parcours commerciaux, sans cacher maintenant la nature simulée des paiements. La checklist possède encore « Publier mon profil de démonstration » sans condition locale sur le libellé ; un canal de production ne transforme pas les intégrations de test en services réels.

### P38-10 — Préserver les vrais outils de gestion des imprévus

Ne pas supprimer « Modifier une seule date », les indisponibilités, l’assistance, l’historique des annulations ou les avertissements d’annulation payante. Un coach choisissant ses horaires a néanmoins besoin de fermer un mardi exceptionnellement sans fermer tous ses mardis ni annuler implicitement ses clients.

Pour les déplacements, aucun calcul de trajet n’est présent : deux séances dans deux lieux peuvent se suivre sans temps de transport imposé. Conserver la liberté horaire demandée ; rendre les lieux et horaires consécutifs lisibles et tester ce cas avec un coach itinérant. Une alerte contextuelle pourra être étudiée, mais ne pas réintroduire automatiquement des pauses ou une cadence.

## Ce qui manque réellement au MVP exploitable

| Domaine | État constaté / dernière preuve | Travail avant l’étape concernée |
| --- | --- | --- |
| Réservation client | Parcours présent et testé localement | Corriger P38-01/02/03 ; recette réelle client iPhone / coach web avec conflit de dernière place et reprise réseau. |
| Encaissement | Simulé, y compris mode connecté | Paiement marketplace en environnement test, commission, échecs, remboursements, versements et justificatifs ; étape commerciale distincte. Pas d’IBAN provisoire maison. |
| Première mise en ligne coach | Dossier, offres, lieux, planning et publication présents | Corriger P38-04 ; mesurer l’activation sans assistance ; opérateur réel de vérification. |
| Équipe | MFA/rôles/attributions testés le 4 octobre | Désigner un compte, pratiquer les décisions/corrections/escalades, prévoir relais et délais annoncés réalistes. Pas de délai garanti inventé dans l’UI. |
| Authentification | Apple et Google précédemment confirmés par le propriétaire | Dernière version iPhone, abandon/reprise, compte Apple masqué, récupération, accès Google des testeurs externes. |
| E-mail | Lien de connexion standard ; domaine/SMTP reportés | Nom de domaine, expéditeur et réception du code réellement validée avant de promettre un OTP. Confirmation et annulation transactionnelles quand ce canal sera activé. |
| Push/Google Calendar | Implémentés, preuves réelles encore ouvertes dans le suivi | Appareil physique, arrière-plan, app fermée, révocation ; synchronisation et conflit sur agenda consenti. Apple Calendar reste un ajout/export. |
| Gestion quotidienne | Réservations extérieures, messages, notes, groupes, annulations présents | Tester une vraie semaine : journée chargée, absence, refus de modification, groupe annulé et compte inaccessible. Réutiliser l’assistance pour les incidents avant d’ajouter un nouveau centre. |
| WebApp | Partage du code et adaptation desktop réussis | P38-05, hébergement HTTPS, liens partageables, mise à jour/cache et retour à une version précédente. Référencement des profils = chantier distinct. |
| Mobile | Sources React Native et workspace iOS | Dernier build signé, clavier, gestes, notifications, grandes polices et VoiceOver. Android non déclaré prêt sans sa propre recette. |
| Photos et documents | Import/stockage et contrôle de type/taille présents | Photos iPhone réelles : conversion/redimensionnement explicites si nécessaires. Le code rejette au-delà de 5 Mo et hors JPEG/PNG/WebP ; ne pas forcer le coach à apprendre les formats. |
| Confidentialité | Notice, contrôles d’accès, export et purge développés | Identité/contact et conservation à finaliser avec le responsable ; procédures réelles et déclarations des stores cohérentes. Cette revue ne certifie pas la conformité juridique. |
| Données et performance | PostgreSQL, commandes atomiques, idempotence, droits ; documents métier JSON et révision globale | Mesurer une charge représentative ; normaliser en priorité réservations, créneaux et messages ; pagination serveur au-delà de la file équipe. Ne pas attendre la notoriété nationale pour mesurer. |
| Sécurité | Protections récentes testées, SecureStore natif, justificatifs privés | Recette physique, maintenance PostgreSQL, suivi des avis de dépendances et révocations. Les deux avis npm du suivi précédent ne sont pas déclarés résolus par cet audit. |
| Exploitation | Scripts santé/sauvegarde et tâches planifiées | Alertes vers un opérateur, restauration complète isolée, préproduction, procédure d’incident et responsabilités. Git ne sauvegarde pas les comptes/fichiers/réglages externes. |
| Mesure d’usage | Tests techniques disponibles ; pas d’instrumentation produit dédiée identifiée dans les sources examinées | Événements minimaux et proportionnés : recherche, profil, choix créneau, abandon, confirmation, nouvelle réservation. Définir finalités/données avant intégration ; aucune collecte ajoutée par cet audit. |

Le paiement et les pièces d’exploitation ne sont pas des fonctions décoratives à retirer pour rendre le produit simple. L’utilisateur peut voir une interface très courte précisément parce que ces mécanismes sont solides derrière.

## Adoption : comment vérifier le potentiel sans se raconter une histoire

**Le principal risque marketplace est le manque de choix réservable près du client**, pas le manque de catégories sportives. Un catalogue national dispersé peut donner une impression de vide. Je recommande un pilote concentré sur un secteur et quelques pratiques avec une offre suffisante, plutôt qu’une ouverture de toutes les villes.

Hypothèses à éprouver :

1. Le client trouve un coach pertinent au moment où il veut pratiquer, comprend immédiatement le prix et ose réserver une première séance.
2. Le coach arrive à ouvrir sa première offre, son lieu et ses disponibilités sans assistance permanente.
3. Son planning reste à jour parce qu’il y gagne du temps avec ses clients habituels autant qu’avec les nouveaux.
4. Client et coach ont une raison de rester sur Partant après la rencontre : re-réservation facile, organisation, rappels fiables, conditions claires et traitement des incidents.
5. La commission reste acceptable par rapport à la valeur apportée et au coût réel d’exploitation. Aucun taux optimal ni budget d’acquisition n’a été validé.

Le coaching peut demander une relation suivie, et des professionnels se déplacent ; ce sont des hypothèses produit à tester, pas des comportements mesurés ici. Les fonctions de récurrence ou de carnets de séances pourraient devenir utiles. **Ne pas les ajouter au MVP par anticipation** : commencer par le bouton de re-réservation déjà présent et observer où il devient insuffisant.

### Pilote proposé, distinct d’une validation déjà obtenue

Commencer avec **5 à 8 coachs de profils différents et 10 à 15 clients**, comme étude qualitative initiale, puis élargir le pilote local. Ce volume ne mesure ni un marché national ni une rentabilité statistique.

| Mise en situation | Ce qu’on observe |
| --- | --- |
| « Je veux un coach près de chez moi, sans date précise » | Compréhension de l’offre et visibilité des prochaines disponibilités. |
| « Je veux courir demain à 19 h, 60 € maximum » | Correspondance pratique/lieu/prix/horaire ; pas d’explication orale du designer. |
| Réserver, déplacer puis annuler | Compréhension de la confirmation et des conséquences ; cohérence entre deux comptes/appareils. |
| Retrouver son coach et réserver une deuxième fois | Nombre d’actions, hésitations, retour inutile à la découverte. |
| Coach : déposer son dossier et préparer sa première semaine | Temps actif de saisie séparé du délai d’examen équipe ; demandes d’aide et erreurs. |
| Coach : ajouter un client habituel, fermer un jour, programmer un groupe | Clarté entre disponibilité, rendez-vous et cours collectif ; préservation des clients déjà inscrits. |
| Agenda chargé, deux lieux, réseau faible | Lisibilité, risque d’erreur, sauvegarde compréhensible, besoin réel de fonctions supplémentaires. |

Mesurer ensuite : proportion de recherches avec offre pertinente réservable, abandon par étape, délai jusqu’à première offre publiée, réservations réalisées, deuxième réservation à 30 jours, coachs maintenant leur agenda chaque semaine, demandes d’assistance par réservation. Séparer usage récurrent, acquisition et qualité du service. Une note esthétique élevée ne remplace pas ces preuves.

## Ordre de travail recommandé

1. **Corriger les incohérences P38-01 à P38-04.** Elles touchent directement pertinence, confiance et activation. Ajouter les scénarios à la non-régression, sans reconstruire l’application.
2. **Terminer la navigation web P38-05 et alléger l’existant P38-06 à P38-09.** Privilégier un changement mesurable à la fois ; conserver les horaires libres, le dossier initial et la DA. Extraire progressivement les composants/parcours de `ProductApp.tsx` (6 353 lignes) et centraliser prix/éligibilité/statuts pour éviter leurs divergences ; ce travail technique ne doit pas modifier la promesse produit.
3. **Recette physique et opérationnelle**, puis pilote observé. Paiement et activation des services nécessaires avant une ouverture commerciale ; aucune intégration reportée n’est activée par ce document.
4. **Ajouter seulement sur preuve d’usage** : récurrence, carnets de séances, import client, autre ville ou discipline. Pas de réseau social, suivi nutritionnel, programme d’entraînement, badges, crédits, abonnement professionnel ni dashboard de graphiques pour compléter artificiellement le produit.

**Critère de réussite :** le client réserve la bonne séance au prix annoncé ; le coach organise sa semaine sans doute sur ce qui est enregistré ou réservé ; l’équipe peut résoudre un incident. L’interface peut alors rester courte sans être incomplète.

## Reprise par le collègue

- Cet audit ajoute des constats ; il n’annule pas les corrections 33–37 déjà livrées.
- État général et dépendances : [ETAT_DU_PROJET.md](../ETAT_DU_PROJET.md).
- Les preuves sont des simulations locales, jamais des comptes utilisateurs. Le [script exploratoire](audits/2026-10-06-produit/probes.cjs) documente l’état défectueux actuel : ce n’est pas encore une suite exigeant les comportements corrigés.
- Pour rejouer : exporter le web, servir `apps/mobile/dist` sur `127.0.0.1:8081`, puis lancer ce script depuis la racine avec Node 24. Le script utilise le Chrome macOS installé ; adapter son chemin sur un autre poste. Les résultats vont dans `work/audit-produit-2026-10-06-replay`.
- Les suites complètes sont `node scripts/qa-33.cjs` et `node scripts/qa-33.cjs --browser`, avec les variables documentées dans le guide de recette.
- Aucun changement de règle métier, migration, secret, habilitation, achat, paiement, build signé ou déploiement réalisé dans cet audit. Les fichiers de rapport sont locaux tant qu’ils n’ont pas été commités/poussés.
