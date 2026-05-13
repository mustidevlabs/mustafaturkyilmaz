# 🚀 Getting started with Strapi

## In this monorepo (single backend)

This Strapi app (**workspace `ledgeria-api`**, repo folder **`backend/`**) is the **one HTTP API + CMS** for:

| Consumer | What it uses |
|----------|----------------|
| **portfolio-web** | REST: `Project`, `Skill`, `About` (and uploads). Optional `STRAPI_API_TOKEN` if Public permissions are tight. |
| **admin-web** | REST: internal tools (e.g. `ledgeria-issue` updates); uses a token with appropriate scopes. |
| **Ledgeria desktop** | Custom route: `POST /ledgeria/v1/issues` → persists to `ledgeria-issue`. |

You do **not** add a second backend for the portfolio: extend content types and permissions here; both Next apps point at the same `NEXT_PUBLIC_STRAPI_URL`.

Strapi Cloud: set the repository **root / base directory** to **`backend`** (this folder).

From repo root: `npm run dev:ledgeria-api`.

---

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
