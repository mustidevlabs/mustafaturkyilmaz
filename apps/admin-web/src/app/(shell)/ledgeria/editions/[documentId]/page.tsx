import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditionEditForm } from "@/components/licensing/EditionEditForm";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { fetchEditionByDocumentId } from "@/lib/ledgeria-licensing";

type Props = { params: Promise<{ documentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { documentId } = await params;
  const edition = await fetchEditionByDocumentId(documentId);
  return {
    title: edition ? `${edition.displayName} — Yetki paketi` : "Yetki paketi — Admin",
  };
}

export default async function EditionDetailPage({ params }: Props) {
  const { documentId } = await params;
  const edition = await fetchEditionByDocumentId(documentId);
  if (!edition) notFound();

  return (
    <div className="py-2">
      <ButtonLink href="/ledgeria/editions" variant="ghost" size="sm">
        ← Yetki paketleri
      </ButtonLink>
      <PageHeader
        className="mt-3"
        title={edition.displayName}
        description={
          <>
            Anahtar:{" "}
            <code className="font-mono text-xs">{edition.editionKey}</code>
            {edition.description ? ` · ${edition.description}` : ""}
          </>
        }
        action={
          <ButtonLink
            href={`/ledgeria/licenses/issue?edition=${encodeURIComponent(edition.editionKey)}`}
          >
            Bu paketle yayınla
          </ButtonLink>
        }
      />
      <div className="mt-8">
        <EditionEditForm edition={edition} />
      </div>
    </div>
  );
}
