import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

const searchIndex = [
  { label: "Command Center", path: "/dashboard", category: "Pages", keywords: "dashboard home command center metrics" },
  { label: "Automation Studio", path: "/generator", category: "Pages", keywords: "generator generate test cases requirements" },
  { label: "Execution Library", path: "/test-scripts", category: "Pages", keywords: "scripts automation playwright cypress selenium" },
  { label: "Quality Knowledge Hub", path: "/knowledge", category: "Pages", keywords: "knowledge documents upload files rag" },
  { label: "Quality Insights", path: "/analytics", category: "Pages", keywords: "analytics charts trends reports" },
  { label: "Test Collections", path: "/suites", category: "Pages", keywords: "suites plans organize folders tags" },
  { label: "Regression Monitor", path: "/regression", category: "Pages", keywords: "regression builds runs compare" },
  { label: "Workspace Settings", path: "/settings", category: "Settings", keywords: "settings profile billing integrations support" },
];

export function GlobalSearch() {
  const navigate = useNavigate();
  const searchOpen = useAppStore((s) => s.searchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === "/" && !searchOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const results = query.trim()
    ? searchIndex.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.keywords.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : searchIndex.slice(0, 6);

  const grouped = results.reduce<Record<string, typeof results>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  function handleSelect(path: string) {
    setSearchOpen(false);
    navigate(path);
  }

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]" style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(6px)" }} onClick={() => setSearchOpen(false)}>
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 20px 60px rgba(30, 41, 59, 0.12), 0 8px 24px rgba(30, 41, 59, 0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <svg className="h-5 w-5 shrink-0" style={{ color: "#94A3B8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, features, settings..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: "#1E293B" }}
          />
          <kbd style={{
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: "0.625rem",
            fontFamily: "monospace",
            fontWeight: 600,
            background: "#F1F5F9",
            color: "#94A3B8",
            border: "1px solid #E2E8F0",
          }}>ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {Object.entries(grouped).length > 0 ? (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{category}</p>
                {items.map((item) => (
                  <button key={item.path} onClick={() => handleSelect(item.path)} type="button"
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{ color: "#64748B" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#1E293B"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; }}
                  >
                    <span className="flex h-2 w-2 rounded-full" style={{ background: "#2563EB" }} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm" style={{ color: "#94A3B8" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
