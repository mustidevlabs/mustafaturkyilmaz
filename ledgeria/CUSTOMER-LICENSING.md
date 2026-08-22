# Müşteri lisanslama (admin kontrol düzlemi)

Satıcıya ait lisanslama UI’si **`apps/admin-web`** içindedir (ayrı `ledgeria-admin/` yok). Masaüstü sözleşmesi Ledgeria (sibling `ledria`) reposunda yaşar:

`docs/product/tr/CUSTOMER-LICENSING.md` — branch `feat/customer-licensing` veya `main`.

Bu admin uygulaması `SignedLicense` + capability id’leriyle **byte düzeyinde** uyumlu kalır.

## Akış

1. **Lisans anahtarları** — Ed25519 çifti üret / gömülü `dev` key. Private key yalnızca sunucuda (şifreli `.data/` veya env).
2. **Müşteriler** — `customerKey` satıcının yazdığı slug’dır (ör. `demo-musteri`); lisans `claims.customerKey` olur. Admin’de sonradan değiştirilebilir; **daha önce imzalanmış dosyalar değişmez**. Masaüstü ilk içe aktarmada `settings.customer_key` olarak mühürler. Müşteri kaydında **lisans şifresi** üretilir (hash’lenir; düz metin bir kez gösterilir).
3. **Edition’lar** — `ngo-full` / `municipality-lite` Strapi bootstrap ile seed edilir; capability ağacı düzenlenir.
4. **Lisans yayınla** — müşteri + edition (ön doldurma) veya özel set; geçerlilik / cihaz kotası; özellikleri işaretle/kaldır; imzala ve `.ledgeria-license` / `.json` indir.
   İmzalı dosyanın `expiresAt` alanı **yerinde düzenlenemez**. Süre uzatmak: Lisanslar → **Süreyi değiştir** → yeni dosya imzala. Aynı şifreyle masaüstü URL’den güncel dosyayı çeker.
5. Masaüstü: **Ayarlar → Tercihler → Lisans** — şifre (URL) veya dosya.
   İndirme: `POST /api/ledgeria/license` `{ password, customerKey?, clientId? }` → imzalı JSON. Masaüstü URL’si `LEDGERIA_LICENSE_DOWNLOAD_URL` veya `package.json` `ledgeria.licenseDownloadUrl`.

Public anahtarı Ledgeria `packages/shared/src/config/licenseKeys.ts` → `LEDGERIA_LICENSE_PUBLIC_KEYS` dizisine yapıştırın. Ayrıntı: [`apps/admin-web/README.md`](../apps/admin-web/README.md).
