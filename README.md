# Mustafa Turkyilmaz — Portfolio (Strapi + Next.js)

Kisisel portfolio uygulamasi. Monorepo seklinde:

```
mustafaturkyilmaz/
├── backend/    # Strapi 5 CMS (TypeScript + SQLite)
├── frontend/   # Next.js 16 (App Router + TypeScript + Tailwind v4)
└── package.json # iki projeyi tek komutla calistirmak icin
```

## Hizli baslangic

Once Node 20+ kurulu oldugundan emin ol (Strapi 5 icin gerekli).

```bash
# 1) Bagimliliklari kur (kok dizinde)
npm install                # root concurrently icin
npm run install:all        # backend + frontend node_modules

# 2) Iki projeyi de paralel baslat
npm run dev
```

Bu komut sunlari calistirir:
- Strapi: http://localhost:1337  (admin: http://localhost:1337/admin)
- Next.js: http://localhost:3000

> Ilk baslatmada Strapi seni admin kullanici olusturmaya yonlendirir.

## Ilk kurulumdan sonra yapmalik

1. Strapi admin paneline gir → **Settings → Users & Permissions Plugin → Roles → Public**.
2. Su content type'larda `find` ve `findOne` yetkisini ac:
   - Project
   - Skill
   - About
3. **Content Manager**'a gec ve once About icerigini doldur, sonra birkac Project ve Skill ekle. **Save** + **Publish** unutma.
4. Frontend'i yenile → `http://localhost:3000` artik canli veri gostermeli.

Alternatif olarak public yetki acmak yerine Strapi'de **Settings → API Tokens → Create new** ile read-only token uretip frontend tarafinda `frontend/.env.local` icine `STRAPI_API_TOKEN=...` koyabilirsin.

## Hazirlanmis content type'lar

| Tip | Kind | Aciklama |
|---|---|---|
| `Project` | collection | Portfoliodaki projeler — title, slug, summary, description, cover, gallery, technologies (JSON), liveUrl, repoUrl, featured, order |
| `Skill` | collection | Yetkinlikler — name, category (Frontend/Backend/Database/DevOps/Tooling/Other), level (0-100), icon, order |
| `About` | single type | Kisisel bilgi — fullName, headline, bio, email, location, avatar, resume, github/linkedin/twitter/website url |

Schema dosyalari `backend/src/api/<name>/content-types/<name>/schema.json` altinda. Strapi acilinca otomatik tanir; admin UI'dan da duzenleyebilirsin.

## Frontend yapisi

- `src/lib/strapi.ts` — Strapi REST API helper. `fetchStrapi<T>()` ve `strapiMedia()` fonksiyonlari.
- `src/types/strapi.ts` — Project / Skill / About / StrapiResponse tipleri.
- `src/app/page.tsx` — anasayfa, About + Projects + Skills cekiyor. Strapi kapaliysa friendly bir uyari gosterir.
- `next.config.ts` — Strapi `localhost:1337/uploads/**` icin `next/image` izinleri tanimli.

## Production icin notlar

- Strapi'de SQLite yerine PostgreSQL kullan (`backend/config/database.ts` ve `.env`).
- Frontend'i Vercel'e, Strapi'yi bir VPS / Strapi Cloud / Render / Railway gibi bir yere koy.
- `frontend/.env.local` icindeki `NEXT_PUBLIC_STRAPI_URL` production URL'iyle guncellenmeli.
- `next.config.ts` icindeki image remotePatterns production hostname'ini de kapsayacak sekilde guncellenmeli.

## Neden bu yapı?

- Strapi 5: TypeScript-native, headless CMS, Admin UI built-in.
- Next.js 16 App Router + Server Components: SEO ve performans icin server-side fetch.
- Tailwind v4: zero-config styling.
- Tek monorepo: kolay yedekleme + tek `npm run dev`.
