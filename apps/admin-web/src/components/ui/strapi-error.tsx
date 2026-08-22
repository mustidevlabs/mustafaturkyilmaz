import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";

export function StrapiLoadError({
  title,
  reason,
  detail,
  strapiUrl,
}: {
  title: string;
  reason: "no_token" | "strapi_error";
  detail?: string;
  strapiUrl?: string;
}) {
  if (reason === "no_token") {
    return (
      <div className="max-w-lg py-8">
        <PageHeader title={title} />
        <Alert tone="warn" className="mt-4">
          <code className="font-mono text-xs">STRAPI_API_TOKEN</code> ve content
          type izinleri gerekli (müşteri, yetki paketi, lisans).
        </Alert>
      </div>
    );
  }
  return (
    <div className="max-w-lg py-8">
      <PageHeader title={`${title} yüklenemedi`} />
      <Alert tone="danger" className="mt-4">
        Strapi yanıt vermedi.
      </Alert>
      <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">
        {detail ?? "Bilinmeyen hata"}
      </pre>
      {strapiUrl ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Strapi: <span className="font-mono text-xs">{strapiUrl}</span>
        </p>
      ) : null}
    </div>
  );
}
