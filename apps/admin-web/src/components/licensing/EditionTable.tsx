"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { LedgeriaEdition } from "@/lib/ledgeria-licensing";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, THead, Th, Td, Tr } from "@/components/ui/table";

export function EditionTable({ editions }: { editions: LedgeriaEdition[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return editions;
    return editions.filter(
      (e) =>
        e.displayName.toLowerCase().includes(needle) ||
        e.editionKey.toLowerCase().includes(needle)
    );
  }, [editions, q]);

  return (
    <div className="mt-6 space-y-3">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Paket ara…"
        className="max-w-xs"
      />
      <Table>
        <THead>
          <tr>
            <Th>Paket</Th>
            <Th>Anahtar</Th>
            <Th>Özellik</Th>
          </tr>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={3} className="text-muted-foreground">
                Eşleşen kayıt yok.
              </Td>
            </Tr>
          ) : (
            rows.map((edition) => (
              <Tr
                key={edition.documentId}
                href={`/ledgeria/editions/${edition.documentId}`}
                onClick={() =>
                  router.push(`/ledgeria/editions/${edition.documentId}`)
                }
              >
                <Td>
                  <p className="font-medium">{edition.displayName}</p>
                  {edition.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {edition.description}
                    </p>
                  ) : null}
                </Td>
                <Td>
                  <code className="font-mono text-xs text-muted-foreground">
                    {edition.editionKey}
                  </code>
                </Td>
                <Td>
                  <Badge>{edition.capabilities.length} özellik</Badge>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
