"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    // Aquí puedes implementar la lógica de búsqueda
    // Por ahora solo guardamos el query
    console.log("Buscando:", value);
  };

  const handleClear = () => {
    setQuery("");
    setIsExpanded(false);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      {!isExpanded ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-9 w-full max-w-sm justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar animales, movimientos...</span>
          <span className="sm:hidden">Buscar...</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      ) : (
        <div className="flex items-center gap-2 w-full max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar animales, movimientos, fincas..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 w-full pl-9 pr-9"
              autoFocus
              onBlur={() => {
                if (!query) setIsExpanded(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClear();
                }
              }}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}