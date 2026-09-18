# Partant — décisions persistantes

- Cible : React Native + TypeScript + Expo, iOS/Android, aperçu web local. Aucun développement Swift préalable ni migration Swift → React Native.
- Lire docs/decisions/001-react-native.md et docs/branchements.md avant de poursuivre les intégrations.
- Préserver le prototype HTML validé et sa DA. apps/mobile est désormais la seule version de travail produit. Le HTML est archivé comme référence ; toute nouvelle modification se fait dans React Native.
- Étapes 1–3 autorisées ; étapes 4 (paiements) et 5 (communications externes) reportées par l’utilisateur.
- Supabase de développement autorisé : jhhsysjdeyqsuztjtgea. Aucun secret dans le frontend ou Git. Les réservations de développement ne sont jamais des paiements.
- Ne jamais modifier le repository Project-H-iOS, utilisé seulement comme référence visuelle.

- Consigne utilisateur confirmée : le prototype est la référence stricte. Reproduire ses écrans et parcours en React Native ; aucune refonte implicite. Lire docs/parite-prototype-react-native.md avant de poursuivre le portage. Ne pas déclarer la parité complète sur la seule base de tests TypeScript/DOM.

- Planning confirmé par l’utilisateur : une seule logique de disponibilités définies par le coach. Aucun mode « heures fixes » ni cadence imposée par Partant. Le coach renseigne ses plages et les offres associées. Pause et espacement ont été retirés à sa demande : les départs suivent le début de plage et la durée de chaque prestation. Les anciennes valeurs sont neutralisées ; les intervalles libres se définissent entre les plages. Tout nouveau coach commence sans horaires ouverts.

- Livraison 9 : chaque plage autorise aussi des lieux. Lire docs/connected-product-9.md. Le mode connecté utilise product-api et le domaine TypeScript partagé ; régénérer scripts/build-server-domain.cjs et redéployer après toute évolution métier. Ne pas réactiver les anciens points d’écriture du pilote SQL. Les étapes 3/4/5 de cette dernière priorisation restent reportées.

- 18 septembre, livraison 10 : l’utilisateur autorise les branchements Google/Apple/carte. Google Cloud, client OAuth Web et Calendar API existent. Microsoft et Stripe explicitement reportés. Lire docs/integrations-10.md avant de poursuivre. Infrastructure Google déployée ; Google Auth et Calendar configurés avec le JSON fourni ; les deux retours acceptés par Google. Consentements utilisateur et premier échange réel encore à tester. Ne jamais imprimer ce fichier ni le copier dans Git. La clé CALENDAR_TOKEN_KEY est déjà installée : ne pas la régénérer.
- Calendar : google-calendar + _shared/google.ts et calendarSync.ts ; cron toutes les cinq minutes, accès privé service_role, secret scheduler Vault. product-api importe ces modules pour revalider les occupations. Redéployer les deux fonctions quand le domaine ou le synchroniseur change. Préserver le consentement agenda distinct du login Google.

- Apple activé le 18 septembre : Team 4STLA425HP, Bundle com.paulfajfrowski.partant, Services ID com.paulfajfrowski.partant.web, Key ID DHW9X54M6A. Expo aligné. Lire docs/configurer-apple.md : secret expirant le 17 mars 2027 à 08:55:30 UTC, renouvellement via scripts/configure-apple-auth.mjs. Clé .p8 locale uniquement, jamais dans Git ni dans les logs. Départ OAuth vérifié ; premier consentement/échange réel et development build signé encore à tester. Aucun SDK Apple natif ni synchronisation iCloud annoncés.

- Recette Auth du 18 septembre : Google renvoie org_internal ; propriétaire doit passer l’audience en Externe/Test. SMTP/domaine explicitement reportés après signalement email rate limit exceeded ; ne pas désactiver les confirmations ni contourner la vérification. Tests connectés Google/Apple, démo locale sans authentification. Voir fin de docs/integrations-10.md.
