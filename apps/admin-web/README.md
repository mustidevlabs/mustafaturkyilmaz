# admin-web

Internal **admin** UI (not the public portfolio).

### Ledgeria

| Route | Purpose |
|-------|---------|
| `/ledgeria/issues` | Issue inbox / board |
| `/ledgeria/customers` | Müşteri CRUD (`customerKey`) + lisans şifresi |
| `POST /api/ledgeria/license` | Masaüstü indirme (şifre; oturum gerekmez) |
| `/ledgeria/editions` | Edition capability şablonları |
| `/ledgeria/licenses` | Lisans geçmişi + indirme |
| `/ledgeria/licenses/issue` | Capability ağacı + Ed25519 `SignedLicense` |
| `/ledgeria/settings/license-keys` | Anahtar çifti üret / rotate / gömülü `dev` key |

Uses the **same Strapi instance** as the portfolio: npm workspace **`ledgeria-api`** in repo folder **`backend/`**.

- **Dev:** `npm run dev` (port **3002**) from this folder, or `npm run dev:admin` from repo root.
- **Env:** copy `.env.example` → `.env.local` — `STRAPI_API_TOKEN`, `NEXT_PUBLIC_STRAPI_URL`, optional signing overrides, optional `NEXT_PUBLIC_PORTFOLIO_URL`.

After deploying new Strapi content types (`ledgeria-customer`, `ledgeria-edition`, `ledgeria-license`), grant the API token create/find/update/delete. Local Strapi bootstrap seeds `ngo-full` and `municipality-lite` (mirrors Ledgeria `editions/*.json`, including nested feature ids).

---

### License signing keys

1. Open **Lisans anahtarları** (`/ledgeria/settings/license-keys`).
2. **Anahtar çifti üret** (veya local için **Gömülü dev anahtarını kullan**).
3. Private key **yalnızca bir kez** gösterilir — kopyalayın / `.env` snippet indirin; “Private key’i kaydettim” ile kapatın.
4. Public key + `keyId` bloğunu Ledgeria  
   `packages/shared/src/config/licenseKeys.ts` → `LEDGERIA_LICENSE_PUBLIC_KEYS` dizisine yapıştırın.
5. Desktop: **Ayarlar → Tercihler → Lisans** — şifre ile `POST /api/ledgeria/license` veya `.ledgeria-license` / `.json` import.
   Yerel: masaüstünü `LEDGERIA_LICENSE_DOWNLOAD_URL=http://localhost:3002/api/ledgeria/license` ile başlatın. Strapi’yi yeniden başlatın (müşteri şifre alanları).

Signing always runs **server-side** (`sign.ts` + Node `crypto`). Private key sources (first match):

| Source | Notes |
|--------|--------|
| `LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64` | Env override (CI / secrets manager) |
| Encrypted `.data/license-signing.json` | UI wizard; AES-256-GCM; gitignored |
| Embedded `dev` | Toggle in UI; matches Ledgeria public `keyId: "dev"` |

Optional: `LEDGERIA_LICENSE_KEY_ID`, `LEDGERIA_LICENSE_KEY_STORE_SECRET` (encrypts the on-disk store; falls back to `STRAPI_API_TOKEN` hash in local).

**Rotate:** double-confirm on the settings page. Add the **new** public entry to Ledgeria; keep old public keys so existing licenses still verify.

Desktop contract / capability model: this repo [`ledgeria/CUSTOMER-LICENSING.md`](../../ledgeria/CUSTOMER-LICENSING.md) and sibling Ledgeria  
`docs/product/tr/CUSTOMER-LICENSING.md` (branch `feat/customer-licensing` or `main`). Capability catalog in admin mirrors `packages/shared/src/types/capability.ts`.

Future: portfolio CMS controls — same app, new routes.
