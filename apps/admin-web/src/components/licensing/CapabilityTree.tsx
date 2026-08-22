"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LEDGERIA_CAPABILITIES,
  LEDGERIA_CAPABILITY_CATALOG,
  applyCapabilityToggle,
  type LedgeriaCapabilityNode,
} from "@/lib/license/capability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  formFieldPrefix?: string;
  editionCapabilities?: string[];
};

function nodeMatches(node: LedgeriaCapabilityNode, q: string): boolean {
  if (!q) return true;
  const hay = `${node.id} ${node.labelTr} ${node.labelEn}`.toLowerCase();
  if (hay.includes(q)) return true;
  return (node.children ?? []).some((c) => nodeMatches(c, q));
}

export function CapabilityTree({
  value,
  onChange,
  formFieldPrefix = "cap_",
  editionCapabilities,
}: Props) {
  const [query, setQuery] = useState("");
  const selected = new Set(value);
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => LEDGERIA_CAPABILITY_CATALOG.filter((n) => nodeMatches(n, q)),
    [q]
  );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {formFieldPrefix
        ? value.map((id) => (
            <input
              key={id}
              type="hidden"
              name={`${formFieldPrefix}${id}`}
              value="on"
            />
          ))
        : null}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Özellik ara…"
        aria-label="Özellik ara"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([...LEDGERIA_CAPABILITIES])}
        >
          Tümünü seç
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([])}
        >
          Temizle
        </Button>
        {editionCapabilities ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange([...editionCapabilities])}
          >
            Pakete sıfırla
          </Button>
        ) : null}
      </div>
      <ul className="max-h-80 space-y-2 overflow-auto pr-1">
        {visible.map((node) => (
          <CapabilityNodeRow
            key={node.id}
            node={node}
            query={q}
            selected={selected}
            onToggle={(id, checked) =>
              onChange(applyCapabilityToggle(value, id, checked))
            }
          />
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {value.length} seçili · çocuk seçince üst modül eklenir · üstü kaldırınca
        alt özellikler temizlenir
      </p>
    </div>
  );
}

function CapabilityNodeRow({
  node,
  selected,
  onToggle,
  query,
  depth = 0,
}: {
  node: LedgeriaCapabilityNode;
  selected: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  query: string;
  depth?: number;
}) {
  if (query && !nodeMatches(node, query)) return null;
  const children = node.children ?? [];
  const childIds = children.map((c) => c.id);
  const checkedChildren = childIds.filter((id) => selected.has(id)).length;
  const selfChecked = selected.has(node.id);
  const indeterminate =
    children.length > 0 &&
    checkedChildren > 0 &&
    checkedChildren < children.length &&
    selfChecked;

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <li className={cn(depth > 0 && "ml-4")}>
      <label className="flex items-start gap-2 text-sm">
        <input
          ref={inputRef}
          type="checkbox"
          className="mt-0.5 accent-primary"
          checked={selfChecked}
          onChange={(e) => onToggle(node.id, e.target.checked)}
        />
        <span>
          <span className="font-medium">{node.labelTr}</span>
          <span className="ml-2 font-mono text-[11px] text-foreground/70">
            {node.id}
          </span>
        </span>
      </label>
      {children.length > 0 ? (
        <ul className="mt-1.5 space-y-1.5">
          {children.map((child) => (
            <CapabilityNodeRow
              key={child.id}
              node={child}
              selected={selected}
              onToggle={onToggle}
              query={query}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
