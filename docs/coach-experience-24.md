# Réglages et parcours coach — livraison 24

Corrections demandées après la recette iPhone, les 21–22 septembre 2026. La DA est conservée ; aucun paiement ni abonnement externe activé.

## Changements

- **Déconnexion** : fermeture immédiate de l’espace privé et isolation des réponses anciennes. Les écritures pas encore lancées sont abandonnées. Le retrait du token push ne bloque plus l’écran. La révocation concerne la session courante, sans déconnecter les autres appareils. L’appel Auth est borné ; le SDK retire sa session locale même en cas de panne réseau, signalée comme révocation distante non confirmée. Une écriture déjà reçue par le serveur peut toutefois avoir été enregistrée.
- **Secteur coach et client** : sélecteur partagé par commune, code postal et département, résolution d’adresse IGN et suggestion depuis un lieu de séance. Les communes franciliennes restent sélectionnables hors connexion. Confirmation explicite ; seul le secteur est retenu. Résolution à la commune ou à l’arrondissement : pas de GPS ni de délimitation exhaustive des quartiers.
- **Enregistrement** : attente dans le bouton pressé, confirmation après accusé serveur, suppression du bandeau qui décale la page. Échec : formulaire conservé pour réessayer. Les requêtes ont une durée bornée. Brouillons conservés sans bandeau permanent ; écritures espacées pendant la frappe et sauvegarde du dernier état en quittant la rubrique.
- **Disponibilités** : semaine habituelle conservée ; écran « Modifier une seule date » depuis Agenda et Disponibilités. Offres et lieux liés aux plages préservés. Fermer une date ne supprime pas les réservations ; retour aux horaires habituels après confirmation.
- **Séances & tarifs** : paragraphe « Créez une offre par formule… » retiré ; accès aux disponibilités conservé.
- **Agendas** : connexions séparées du formulaire d’indisponibilité ; texte Google allégé. Apple Calendar : ajout à confirmer depuis le détail d’une séance, sans promesse de synchronisation iCloud.
- **Versements** : vrais libellés professionnels en connecté, compte de test explicite et activation non répétée. Banque et IBAN seront rattachés au prestataire lors du branchement des paiements. Aucun champ bancaire fictivement opérationnel ni stockage d’IBAN ajouté.
- **Notifications** : une activation iPhone, puis « Vos séances » et « Vos échanges », sans doubles interrupteurs ni second bouton Enregistrer. Alignement atomique des préférences push et anciennes préférences métier. Les refus antérieurs restent respectés tant que l’utilisateur ne les change pas. Permissions réévaluées au retour des réglages iOS. Les messages restent dans leur rubrique dédiée.
- **Dossiers** : statut, prochaine action et assistance clarifiés. Accès équipe visible aussi depuis les réglages coach habilité. Pas d’auto-validation de son propre dossier en connecté.

## Valider un dossier, y compris pour un test

La validation existait côté serveur, mais la base ne contenait **aucun compte équipe** au début de cette livraison.

1. Désigner l’adresse exacte d’un compte Partant confirmé et dont l’inscription est terminée, distinct du coach à vérifier.
2. Un administrateur exécute `node scripts/configure-team-24.mjs adresse@exemple.fr` à la racine. Le script exige un compte unique existant, n’envoie aucun e-mail et n’est jamais exposé au client. `--revoke` retire l’habilitation.
3. Actualiser Partant, puis ouvrir **Espace équipe** depuis Mon espace (client) ou Réglages (coach habilité).
4. Choisir le dossier soumis, consulter les justificatifs, choisir Valider / Demander une correction / Refuser et saisir un motif.
5. Enregistrer la décision. Le coach voit le statut et reçoit une notification interne. La validation ne publie pas automatiquement son profil.

Le compte équipe du propriétaire n’a pas encore été désigné : aucun droit n’a été accordé à un compte deviné. Les tests utilisent un compte QA distinct, supprimé après recette. La démonstration conserve un espace équipe simulé sans certification réelle.

## Serveur et confidentialité

Trois migrations additives : préférences unifiées ; retrait d’appareil lié à sa session ; clause explicite de sélection de la révision requise par la protection des mises à jour de la Data API. Le dernier point a été découvert par les tests HTTP réels, après les tests SQL.

`product_push_settings` reste réservé au rôle serveur ; il réutilise la vérification de session active et de compte enregistré. Les tables privées restent fermées aux clients. Une déconnexion ancienne ne retire pas l’appareil réenregistré dans une nouvelle session. Domaine partagé régénéré et fonctions qui l’importent redéployées.

Le propriétaire déclare la clé APNs compatible Sandbox et Production. Le serveur reste en Sandbox pour les builds de développement. Aucune clé privée modifiée ni publiée.

## Vérification

- TypeScript, export web et bundle JavaScript/Hermes iOS.
- Domaine connecté : 61 contrôles ; Auth native simulée : 19 ; push natifs simulés : 9.
- API/Auth/Storage réels : 36 contrôles ; HTTP push/confidentialité/polling : 17.
- Tests SQL transactionnels annulés : préférences atomiques, refus antérieurs, activation effective, révision, autres champs préservés, sessions invalides, grants et retrait tardif d’appareil.
- Secteurs et interdiction d’auto-validation : 16 contrôles.
- DOM : réglages existants, navigation, confirmation après serveur, refus avec reprise, catégories sans doublon et déconnexion lente/hors connexion.
- Advisors inchangés : informations RLS pour les tables privées fermées ; avertissement antérieur sur la protection des mots de passe compromis.

Les tests DOM ne valident pas le rendu ou les gestes natifs. L’export iOS n’est pas un build Xcode signé. La recette iPhone reste nécessaire, en particulier déconnexion hors connexion, clavier/sélecteur de secteur et permissions push. Les paiements et la réception réelle d’un push ne sont pas validés par cette recette.

Sources : [déconnexion Supabase](https://supabase.com/docs/reference/javascript/auth-signout), SDK Auth 2.116.0 installé, [géocodage IGN](https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage).
