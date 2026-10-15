# F03 — équipe et dossiers coach

15 octobre 2026. Dépôt canonique : `/Users/wilsonlim/Desktop/Partant/Partant`. Branche `feature/03-equipe-dossiers`, créée depuis `origin/main` actualisé à `3889bd8` (aucun écart avec `main`, aucune branche/PR F03 préexistante). **Recette réelle partielle : premier reviewer habilité et MFA validée, demande de complément enregistrée ; suite bloquée par l'authentification du second reviewer et la reprise du parcours coach. F03 n'est pas clôturée.**

## Autorisations et environnement

Wilson a explicitement désigné deux comptes comme `reviewer` et un compte coach pour cette recette, puis autorisé l'utilisation des quatre pièces déjà présentes. Les identités exactes restent dans la conversation et la base privée ; aucune adresse personnelle n'est nécessaire dans ce bilan public du dépôt. Aucun rôle `admin` ou `support` n'a été accordé. Les trois comptes sont confirmés dans Auth et possèdent leur profil Partant ; le coach reste coach sans habilitation équipe.

Les deux habilitations ont été appliquées par `scripts/configure-team-24.mjs`, avec `--role=reviewer` explicite, sur le seul projet de développement `jhhsysjdeyqsuztjtgea`. La CLI Supabase 2.119.0 autorisée fonctionne ; le connecteur SQL renvoie un refus de permission. Le script ne crée pas de compte et n'envoie pas d'invitation. Ces habilitations distantes ne sont pas déployées par Git.

Node 24.19.0 selon `.nvmrc`, dépendances et lockfiles existants conservés. `apps/mobile/.env` est présent, ignoré par Git et pointe vers le bon projet avec une clé publique non fictive ; aucune valeur n'a été affichée. Le serveur 8081 existant sert bien `apps/web/dist` (comparaison de l'index HTTP avec le fichier local). Cet export connecté a ensuite été reconstruit depuis les sources F03, sans modifier `.env` ni arrêter le serveur. Les essais automatisés utilisent un autre export, `work/f03/qa-dist`, avec une clé QA fictive et un serveur local séparé sur 8096.

## Échanges réels exécutés

Navigateur de Wilson sur macOS, WebApp connectée sur 8081, Auth/API/Storage du projet de développement. Sources produit identiques à `3889bd8` : les changements du lot portent uniquement sur les tests et ce bilan.

| Scénario | Attendu | Obtenu et preuve |
| --- | --- | --- |
| Prérequis des comptes désignés | Comptes confirmés et profils terminés, sans promotion supposée | Lecture SQL limitée aux trois comptes : conditions remplies, aucune habilitation initiale |
| Habilitation reviewer | Seuls les comptes désignés reçoivent ce rôle | Script exécuté pour chacun ; lecture après premier grant : reviewer présent, coach sans droit équipe |
| Entrée du premier reviewer avant MFA | Écran de sécurité, aucun accès aux dossiers | « Votre accès équipe » observé après le grant, avant l'enrôlement personnel |
| MFA du premier reviewer | Facteur personnel vérifié, file accessible | Enrôlement/code effectués par Wilson ; un facteur vérifié, aucun facteur non vérifié au contrôle ; file et détail ensuite observés |
| Détail du coach désigné | Pièces et pratique chargées à l'ouverture | Quatre pièces, pratique « Préparation physique » en attente ; dossier ouvert avec attribution au premier reviewer |
| Ouverture privée d'un justificatif | Le reviewer AAL2 peut ouvrir une pièce | PDF réellement ouvert depuis « Ouvrir · Identité ». URL signée exclue des preuves ; capture de la pièce supprimée après constat de données d'identité |
| Demande de complément | Confirmation après enregistrement, motif et acteur conservés | Statut « À corriger » observé ; lecture serveur : `correction`, date `2026-10-15T13:01:14.232Z`, acteur correspondant au premier reviewer et empreinte non vide |
| Historique et filtre | Décision retrouvable après passage de « À examiner » à « Tous » | Dossier rouvert avec le motif et l'historique, sans nouvelle écriture métier |
| Connexion du second reviewer | Session indépendante puis MFA | **Bloquée** : Wilson signale la limite d'envoi de deux e-mails. Aucune confirmation désactivée, aucun contournement ni faux facteur fourni |

La mention « pièces fictives » dans le motif de complément qualifie l'intention de recette ; elle ne certifie pas le contenu des fichiers. Le justificatif d'identité ouvert contient des données personnelles. Aucune qualification professionnelle réelle n'a été approuvée par l'agent ; une décision de fond doit être effectuée par l'examinateur humain. La preuve visuelle conservée porte sur l'état du dossier, sans contenu du justificatif, QR, clé TOTP ou jeton.

Le contrôle initial constatait zéro compte technique `partant-qa-…@example.invalid` et zéro attribution. Wilson a pris des dossiers en charge pendant son essai manuel ; seule la décision sur le coach explicitement autorisé a été effectuée par l'agent. Aucun autre dossier n'a été modifié par celui-ci.

## Contrôles automatisés et changements partageables

Aucun défaut produit reproduit dans les scénarios locaux exécutés ; aucun écran, règle métier, permission serveur ou dépendance n'a été modifié. La couverture existante est complétée dans deux suites déjà exécutées par la CI :

- Équipe DOM : provoquer un HTTP 409 avec une empreinte de pièces modifiée ; vérifier le rechargement du détail, l'absence de confirmation, la conservation du motif et le changement de référence de décision pour les nouvelles preuves. Le test conserve ensuite la perte d'accusé simulée et le renvoi avec le même ID pour cette même décision.
- Domaine documentaire : utiliser explicitement un acteur `reviewer`, refuser une décision `reviewPractice` du support, exiger le motif d'un refus, conserver acteur/date/empreinte et historique, bloquer les offres de la pratique refusée puis vérifier qu'une nouvelle soumission exige une nouvelle décision.

| Contrôle du lot | Résultat | Portée |
| --- | --- | --- |
| TypeScript | Réussi | Source React Native/Web commune |
| Export QA web et reconstruction WebApp connectée | Réussis | Exports locaux, aucune publication |
| Métier/DOM complet | 49/49 suites réussies | Fixtures locales, dont 44 contrôles documentaires et 14 contrôles équipe ; aucune transaction Auth/API réelle dans ces suites |
| Équipe DOM à 1440 px | 14 contrôles réussis | Même conflit et reprise, écran desktop simulé |
| Navigateur équipe 390/1440 px | 12 contrôles réussis | Chrome local, réponses Auth/API fictives ; aucune violation axe, erreur JS ou débordement détecté dans les états couverts |
| Contrôle des secrets | Réussi | Contrôle des fichiers suivis, pas audit exhaustif de l'historique Git |

Les sorties et captures non sensibles restent locales dans `work/f03/`, ignoré par Git. Le test de volume a réécrit son rapport historique ; sa nouvelle sortie a été copiée dans ce dossier et le rapport versionné a été rétabli, hors du lot. Les premières tentatives d'export à la racine et de fixture de refus ont échoué avant leur correction de lancement/préparation ; les résultats finaux ci-dessus portent sur les relances réussies.

Les tests DOM du conflit et de perte de réponse ne prouvent pas une panne réelle du réseau Supabase. La pagination sur 12 dossiers est simulée dans le navigateur, pas une nouvelle preuve de pagination SQL sur 11 dossiers réels. Les preuves historiques de la livraison 37 ne sont pas redatées comme recette F03.

## Reprise obligatoire avant clôture

1. Après levée du quota e-mail, connecter le second reviewer dans une session séparée et lui faire configurer/valider son facteur personnel. Ne jamais appliquer le helper TOTP des comptes QA à un compte conservé.
2. Avec les deux reviewers AAL2, remettre le seul dossier autorisé à disposition puis faire concourir deux prises en charge. Vérifier un seul gagnant et le refus de décision du perdant. Aucun rôle admin n'est autorisé pour libérer arbitrairement un dossier tiers.
3. Connecter le coach désigné et constater la demande de complément. Corriger puis soumettre à nouveau ; faire enregistrer la décision motivée par pratique par le reviewer humain et vérifier son accusé serveur ainsi que le retour côté coach. Rejouer refus, validités et nouvelle discipline sans validation héritée avec des pièces de test adaptées, sans substituer directement du SQL au parcours coach.
4. Rejouer les refus Auth/API/Storage sans rôle, AAL1 et facteur non vérifié ; tester les droits support avec une identité de test expressément autorisée ou des fixtures techniques isolées. Aucun compte conservé n'a été promu en support pour simuler ce cas.
5. Tester révocation de session/facteur, puis refus de création d'une nouvelle URL privée avec l'ancien accès. Une URL déjà signée peut survivre jusqu'à 60 secondes ; ne pas assimiler le seul verrouillage de l'écran à une révocation serveur. L'enrôlement et les sessions personnelles n'ont pas été supprimés pendant le blocage de reconnexion.
6. Rejouer pagination serveur par 10, recherche/filtres, détail à la demande et conflit/perte de réponse sur le serveur avec des fixtures isolées, puis vérifier leur nettoyage. Conserver les comptes de recette et leurs habilitations désignées ; demander une nouvelle décision explicite pour leur retrait.

L'iPhone physique, le simulateur natif, la validation professionnelle de fond et la recette complète de sécurité ne sont pas revendiqués par ce lot. F01/F02 physiques restent ouverts. Paiement, SMTP/domaine, communications externes, Outlook et publication demeurent reportés.

## Préservation et livraison

Les différences initiales de `project.pbxproj`, `Info.plist` et `Podfile.lock` sont conservées hors commit, avec empreintes de départ et patch local dans `work/f03/`. Les six copies non suivies finissant par « 2 » restent intactes : trois sont identiques aux canoniques, les trois autres sont des versions documentaires antérieures comparées, jamais utilisées comme source produit. Aucun changement du HTML archivé ni de Project-H-iOS.

Pas de changement de domaine partagé, migration ou fonction : aucun déploiement Supabase requis. Les habilitations et la décision réelles sont les seules opérations distantes de ce lot réalisées par l'agent. PR dédiée sans fusion ; résultat de CI à consigner après exécution sur son dernier commit.
