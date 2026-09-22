# DesktopShell

Présentation React Native Web à monter à partir de `DESKTOP_BREAKPOINT` (1080 px). Le parent conserve le rôle serveur, les permissions, la navigation, les données et le défilement du contenu. Aucun accès Auth ni aucune écriture métier dans le shell.

Le contenu possède trois largeurs : `wide` (1480 px maximum), `reading` (880 px), `form` (620 px). Le shell remplit son parent ; monter celui-ci dans un conteneur de hauteur bornée et conserver le `ScrollView` existant dans `children`. `contentStyle` peut adapter la surface à un écran particulier. Les écrans mobiles/tablettes ne dépendent pas du shell.

## Branchement à ProductApp

- `role` : `store.account?.role ?? "client"`. Utiliser `team` seulement pour présenter l’espace équipe avec `staff={!!store.staff}` ; la permission reste décidée par le serveur.
- `activeItem` : `coachTab` lorsque `screen === "coach"`, sinon l’identifiant de navigation correspondant ; `chat` reste associé à `messages`. Les formulaires de configuration peuvent conserver `settings` comme repère.
- `unreadCounts` : `{ messages: unreadMessages, notifications: unread }`. Ces comptes sont déjà calculés séparément dans ProductApp ; aucun cumul n’est ajouté par le shell.
- `navigationDisabled` : `busy || market.leaving || (live && market.pending > 0)`.
- `onNavigate` : `agenda/clients/activity/settings` appellent `go("coach")` puis `setCoachTab(item)` ; `help` appelle `go("support-native")` ; `account` appelle la destination compte adaptée au rôle (`account-native` coach, `account` client) ; les autres valeurs appellent `go(item)`.
- `userName` / `accountLabel` : identité fournie par le parent, ou libellé `Se connecter` pour une visite sans compte. Le parent choisit alors la destination Auth appropriée.
- `title` / `subtitle` : titre de page et contexte facultatif. `sidebarFooter` permet un contrôle de démonstration explicitement nommé, conservé sous la responsabilité du parent.

Éviter de conserver dans `children` la fausse barre de statut du téléphone, la navigation mobile et les raccourcis d’en-tête vers Messages/Notifications : ils possèdent déjà leur entrée persistante. Les retours contextuels de sous-parcours restent dans le contenu.

Les boutons utilisent les interactions clavier de `Pressable` Web, avec état sélectionné, désactivé, survol et focus visible. Les régions navigation/contenu sont identifiées. Les tests TypeScript passent ; le rendu, les dimensions et les interactions clavier doivent être vérifiés dans la WebApp intégrée.
