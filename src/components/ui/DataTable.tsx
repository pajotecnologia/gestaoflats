"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Inbox,
  Plus,
  MoreVertical,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
  accessor?: (item: T) => any;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchableKeys?: (keyof T | string)[];
  statusFilterOptions?: { label: string; value: string }[];
  statusKey?: keyof T | string;
  statusFilterValue?: string;
  onStatusFilterChange?: (val: string) => void;
  onAddNew?: () => void;
  addNewText?: string;
  actions?: (item: T) => React.ReactNode;
  renderMobileCard?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  emptySearchMessage?: string;
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  headerRightContent?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchPlaceholder = "Buscar registros...",
  searchableKeys,
  statusFilterOptions,
  statusKey = "status",
  statusFilterValue: controlledStatusFilter,
  onStatusFilterChange,
  onAddNew,
  addNewText = "Novo Registro",
  actions,
  renderMobileCard,
  emptyMessage = "Nenhum registro encontrado.",
  emptySearchMessage = "Nenhum resultado corresponde aos filtros aplicados.",
  initialSortKey,
  initialSortDir = "asc",
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  headerRightContent,
}: DataTableProps<T>) {
  // Estado de Busca com Debounce de 300ms
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filtro de Status interno (se não controlado)
  const [internalStatusFilter, setInternalStatusFilter] = useState("TODOS");
  const currentStatusFilter = controlledStatusFilter !== undefined ? controlledStatusFilter : internalStatusFilter;

  const handleStatusChange = (val: string) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(val);
    } else {
      setInternalStatusFilter(val);
    }
  };

  // Ordenação
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey || null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Resetar para página 1 ao buscar ou filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, currentStatusFilter, pageSize]);

  // Filtragem e Ordenação dos Dados
  const filteredData = useMemo(() => {
    let result = [...data];

    // 1. Filtro de Busca (Debounce)
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim();
      result = result.filter((item) => {
        if (searchableKeys && searchableKeys.length > 0) {
          return searchableKeys.some((key) => {
            const val = item[key as string];
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(term);
          });
        }
        // Se não especificado, busca em todos os valores do objeto
        return Object.values(item).some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === "object") return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    // 2. Filtro de Status
    if (currentStatusFilter && currentStatusFilter !== "TODOS") {
      result = result.filter((item) => {
        const val = item[statusKey as string];
        if (typeof val === "string") {
          return val.toUpperCase() === currentStatusFilter.toUpperCase();
        }
        return val === currentStatusFilter;
      });
    }

    // 3. Ordenação
    if (sortKey) {
      const colDef = columns.find((c) => c.key === sortKey);
      result.sort((a, b) => {
        let valA = colDef?.accessor ? colDef.accessor(a) : a[sortKey];
        let valB = colDef?.accessor ? colDef.accessor(b) : b[sortKey];

        if (valA === null || valA === undefined) valA = "";
        if (valB === null || valB === undefined) valB = "";

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDir === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        return sortDir === "asc" ? strA.localeCompare(strB, "pt-BR") : strB.localeCompare(strA, "pt-BR");
      });
    }

    return result;
  }, [data, debouncedSearch, currentStatusFilter, statusKey, searchableKeys, sortKey, sortDir, columns]);

  // Paginação dos dados
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIdx = (validCurrentPage - 1) * pageSize;
    return filteredData.slice(startIdx, startIdx + pageSize);
  }, [filteredData, validCurrentPage, pageSize]);

  const startRecord = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(validCurrentPage * pageSize, totalItems);

  return (
    <div className="space-y-4">
      {/* ================================================================= */}
      {/* 1. BARRA DE FERRAMENTAS (BUSCA, FILTRO DE STATUS E AÇÕES)         */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Input de Busca com Debounce */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded-full"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro Dropdown por Status */}
          {statusFilterOptions && statusFilterOptions.length > 0 && (
            <div className="flex items-center space-x-1.5 shrink-0">
              <div className="relative">
                <select
                  value={currentStatusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="TODOS">Todos os Status</option>
                  {statusFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Botão Novo Registro & Conteúdo Extra */}
        <div className="flex items-center space-x-2 shrink-0">
          {headerRightContent}

          {onAddNew && (
            <button
              onClick={onAddNew}
              className="w-full sm:w-auto min-h-[38px] px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-1.5 transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{addNewText}</span>
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. TABELA RESPONSIVA / CARDS MÓVEIS                              */}
      {/* ================================================================= */}
      <div className="bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
        {/* Visualização Desktop & Tablet (Tabela) */}
        <div className={`${renderMobileCard ? "hidden md:block" : "block"} overflow-x-auto`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-950/60 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key, col.sortable)}
                      className={`py-3.5 px-4 ${col.headerClassName || ""} ${
                        col.sortable ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="shrink-0 text-slate-400 dark:text-zinc-500">
                            {isSorted ? (
                              sortDir === "asc" ? (
                                <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {actions && <th className="py-3.5 px-4 text-right">Ações</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800/60 text-xs">
              {loading ? (
                // Skeleton Loader Desktop
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((col, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                      </td>
                    ))}
                    {actions && (
                      <td className="py-4 px-4 text-right">
                        <div className="h-7 w-14 bg-slate-200 dark:bg-zinc-800 rounded-lg ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 dark:text-zinc-500">
                      <Inbox className="w-8 h-8 opacity-40" />
                      <p className="text-xs font-medium">
                        {debouncedSearch || currentStatusFilter !== "TODOS" ? emptySearchMessage : emptyMessage}
                      </p>
                      {(debouncedSearch || currentStatusFilter !== "TODOS") && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            handleStatusChange("TODOS");
                          }}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                        >
                          Limpar todos os filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => (
                  <tr
                    key={item.id || rowIdx}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors duration-150 group"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`py-3.5 px-4 ${col.className || ""}`}>
                        {col.render ? col.render(item, rowIdx) : item[col.key]}
                      </td>
                    ))}
                    {actions && <td className="py-3.5 px-4 text-right">{actions(item)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Visualização Mobile com Cards Verticais (quando renderMobileCard estiver definido) */}
        {renderMobileCard && (
          <div className="md:hidden divide-y divide-slate-200/80 dark:divide-zinc-800/80">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded" />
                </div>
              ))
            ) : paginatedData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                {debouncedSearch || currentStatusFilter !== "TODOS" ? emptySearchMessage : emptyMessage}
              </div>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <div key={item.id || rowIdx} className="p-4 bg-white dark:bg-zinc-900/80">
                  {renderMobileCard(item)}
                  {actions && <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">{actions(item)}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. BARRA DE PAGINAÇÃO                                             */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 text-xs text-slate-500 dark:text-zinc-400 select-none">
          <div className="flex items-center space-x-2">
            <span>
              Mostrando <strong className="text-slate-900 dark:text-zinc-200">{startRecord}</strong> a{" "}
              <strong className="text-slate-900 dark:text-zinc-200">{endRecord}</strong> de{" "}
              <strong className="text-slate-900 dark:text-zinc-200">{totalItems}</strong> registros
            </span>

            {/* Seletor de Itens por Página */}
            <div className="hidden sm:flex items-center space-x-1.5 ml-4 pl-4 border-l border-slate-200 dark:border-zinc-800">
              <span>Exibir:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="py-1 px-2 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} por pág.
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Controles de Navegação */}
          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Página Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Páginas numeradas */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && validCurrentPage > 3) {
                  pageNum = validCurrentPage - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg transition ${
                      validCurrentPage === pageNum
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Próxima Página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DataTable;
