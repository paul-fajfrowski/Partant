# Documents & vérifications — livraison 26

Demande du 22 septembre 2026. Périmètre : améliorer cette rubrique et ses liens indispensables avec le parcours coach, les offres et l’examen par l’équipe. Aucune nouvelle webApp desktop ni nouveau système de paiement dans cette livraison.

## Parcours

- Le dossier reste la première étape du nouveau coach connecté. Aucun bouton « Compléter plus tard » ni parcours permettant de sauter cette étape n’est ajouté. La création technique du compte Auth précède nécessairement le dépôt privé ; la publication reste conditionnée à la vérification.
- Choix des pratiques et de la situation professionnelle. Depuis le profil, lien vers cette rubrique ; modifier la discipline principale ne transmet jamais une ancienne validation à une nouvelle discipline.
- Dossier professionnel commun : identité et assurance (exigences de dossier Partant, pas affirmation d’une règle juridique universelle).
- Pratiques à vérifier : besoins adaptés, pièces manquantes, décision et motif propres à chaque pratique. Pas d’affichage permanent de toutes les pièces et de tout l’historique.
- Bibliothèque privée : un document, plusieurs pratiques ; ajouter, ouvrir, remplacer, retirer avec confirmation et enregistrer. Validité distincte pour chaque document, sans date artificielle obligatoire pour un diplôme sans expiration.
- Statuts lisibles : À compléter, En vérification, Validée, À corriger, Non autorisée, À renouveler. Les références restent explicitement fictives en démo.
- Enregistrement confirmé après réponse serveur ; erreur et formulaire conservés pour réessayer. Brouillons isolés par compte.

## Vérification et portée

`verification.ts` centralise le modèle versionné et les besoins initiaux. Professionnel qualifié, formation, qualification étrangère et situation particulière ont des parcours distincts. Un stagiaire fournit une attestation de stagiaire : ni diplôme terminé ni carte professionnelle ordinaire ne sont artificiellement exigés de lui.

Yoga, récupération et situations particulières restent soumis à un examen du cadre réel ; aucun intitulé ne confère une exemption automatique. L’interface demande un contexte et permet des compléments. Pour la natation, rappel de contrôle des prérogatives et recyclage applicable, sans prétendre qu’un document unique conviendrait à tous les diplômes.

L’équipe choisit une pratique, consulte ses pièces communes/spécifiques, vérifie sa checklist et consigne une décision motivée. Accès au registre officiel. Date, pratique et acteur de décision enregistrés. Aucune auto-validation connectée, y compris pour un membre de l’équipe qui serait aussi coach. Pas d’OCR ou de consultation automatique du registre annoncés.

La checklist assiste l’examinateur ; elle ne remplace pas une vérification effective. Avant l’ouverture publique, finaliser la matrice juridique des activités, publics et restrictions avec les interlocuteurs compétents. Cette livraison ne constitue pas une certification réglementaire automatisée.

Sources :
- https://www.sports.gouv.fr/educateurs-sportifs
- https://www.sports.gouv.fr/se-declarer-educateur-sportif
- https://www.sports.gouv.fr/diplomes-etrangers-496
- https://recherche-educateur.sports.gouv.fr/

## Intégrité et compatibilité

- Une décision dépend des pièces effectivement liées à la pratique, du statut et du contexte. Étendre l’utilisation d’un document à une nouvelle pratique ne valide pas cette dernière et ne révoque pas la première.
- Modifier un justificatif invalide les validations qui en dépendent. Modifier une pièce commune affecte toutes ses pratiques. Changer l’identité publique ou la description des qualifications provoque un nouvel examen.
- Les offres ont désormais une discipline. Les offres et cours historiques sont rattachés à leur ancienne discipline avant un changement du périmètre. Une pratique en attente ou expirée n’ouvre pas de nouvelles réservations ; les réservations déjà confirmées restent conservées.
- Une pratique déjà approuvée reste disponible lorsqu’une autre est ajoutée ou demande une correction, si le profil était publié et que les justificatifs utiles restent valides. Aucun profil n’est publié automatiquement.
- Les anciens dossiers restent lisibles ; la conversion conserve uniquement la validation de la discipline principale précédemment déclarée. Les anciennes décisions globales ne deviennent pas des autorisations pour toutes les spécialités.
- Les champs d’approbation fournis par le coach sont ignorés. Les anciens points de sauvegarde ne peuvent pas remplacer un dossier déjà converti. Les décisions sur des pièces qui ont changé entretemps sont refusées.
- Les références de fichiers sont limitées au répertoire du propriétaire ; l’API vérifie également l’existence des objets privés. Seuls le coach et l’équipe peuvent ouvrir les pièces. La projection publique ne contient que les pratiques approuvées et leurs validités, jamais les pièces, leur contexte ni les motifs internes.
- L’effacement de compte retire aussi les nouveaux champs documentaires du dossier métier ; les limites antérieures de suppression physique/archivage restent celles de la livraison 25.

## Serveur, tests et simulation

Aucune nouvelle table ni permission. Domaine TypeScript partagé régénéré ; `product-api`, `google-calendar` et `push-dispatch` redéployés sur le projet de développement existant.

Contrôles :
- TypeScript sans erreur.
- 38 contrôles métier spécifiques (droits, portée, réutilisation, expiration, dates, pièces et confidentialité).
- 61 régressions domaine connecté, 53 contrôles confidentialité, 16 secteurs/auto-validation.
- 14 contrôles DOM du parcours documentaire et 6 du mode connecté simulé, dont attente, échec, conservation et nouvelle tentative.
- 15 régressions DOM réglages/déconnexion.
- 15 contrôles HTTP réels Auth/API/Storage sur des comptes QA isolés ; fichiers retirés, comptes/données QA nettoyés, zéro compte QA restant. Aucun compte propriétaire habilité par déduction.
- Captures Chromium 390 × 844 et desktop ; aucun événement `pageerror`. Ce contrôle web ne vaut pas une recette native iPhone.
- Export web et export iOS/Hermes 3,6 Mo réussis avec les sources finales. Le composant `PracticeReviewPanel` est inclus. Un premier export local avait résolu le module mais son compilateur Hermes avait été interrompu (SIGKILL) ; la vérification complète a été refaite dans un dossier de build temporaire avec les versions du lockfile, sans changer les dépendances du projet ni les réglages Xcode.

Le propriétaire avait lancé Xcode pendant les modifications : la capture montrait `Unable to resolve module ./PracticeReviewPanel`. Le fichier et son import sont présents et vérifiés dans l’export final. Relancer le build Xcode après livraison ; aucune nouvelle installation CocoaPods requise pour ces changements TypeScript. Le build Xcode signé et l’import de pièces sur iPhone restent à vérifier par le propriétaire.

Simulation locale : http://127.0.0.1:8081/simulation.html?mode=connected&version=documents-26

## À poursuivre séparément

Le compte équipe du propriétaire n’a pas encore été désigné. La validation de test réelle est fonctionnelle pour les comptes habilités, mais aucun propriétaire n’a reçu de droit par supposition. Le backoffice web desktop avec files de travail, affectation et statistiques reste une étape distincte ; le présent panneau complète uniquement la décision par pratique dans l’espace équipe existant.
