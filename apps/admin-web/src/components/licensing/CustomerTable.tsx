"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { LedgeriaCustomer } from "@/lib/ledgeria-licensing";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Table, THead, Th, Td, Tr } from "@/components/ui/table";

export function CustomerTable({ customers }: { customers: LedgeriaCustomer[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return customers.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (!needle) return true;
      return (
        c.displayName.toLowerCase().includes(needle) ||
        c.customerKey.toLowerCase().includes(needle)
      );
    });
  }, [customers, q, status]);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ad veya anahtar ara…"
          className="max-w-xs"
        />
        <NativeSelect
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "all" | "active" | "suspended")
          }
          className="w-40"
        >
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </NativeSelect>
      </div>
      <Table>
        <THead>
          <tr>
            <Th>Müşteri</Th>
            <Th>Anahtar</Th>
            <Th>Şifre</Th>
            <Th>Durum</Th>
          </tr>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={4} className="text-muted-foreground">
                Eşleşen kayıt yok.
              </Td>
            </Tr>
          ) : (
            rows.map((c) => (
              <Tr
                key={c.documentId}
                href={`/ledgeria/customers/${c.documentId}`}
                onClick={() =>
                  router.push(`/ledgeria/customers/${c.documentId}`)
                }
              >
                <Td className="font-medium">{c.displayName}</Td>
                <Td>
                  <code className="font-mono text-xs text-muted-foreground">
                    {c.customerKey}
                  </code>
                </Td>
                <Td>
                  <Badge tone={c.hasDownloadPassword ? "success" : "neutral"}>
                    {c.hasDownloadPassword ? "Var" : "Yok"}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={c.status === "active" ? "success" : "warn"}>
                    {c.status === "active" ? "Aktif" : "Askıda"}
                  </Badge>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
