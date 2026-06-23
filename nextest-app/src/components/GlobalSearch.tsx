import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

const searchIndex = [
  { label: "Dashboard", path: "/dashboard", category: "Pages", keywords: "dashboard home command center metrics" },
  { label: "Test Case Generator", path: "/generator", category: "Pages", keywords: "generator generate test cases requirements" },
  { label: "Automation Scripts", path: "/test-scripts", category: "Pages", keywords: "scripts automation playwright cypress selenium" },
  { label: "Knowledge Base", path: "/knowledge", category: "Pages", keywords: "knowledge documents upload files rag" },
  { label: "AI Configuration", path: "/ai-settings", category: "Pages", keywords: "ai settings provider api key gemini openai" },
  { label: "Analytics", path: "/analytics", category: "Pages", keywords: "analytics charts trends reports" },
  { label: "Test Suites", path: "/suites", category: "Pages", keywords: "suites plans organize folders tags" },
  { label: "Profile & Team", path: "/profile", category: "Pages", keywords: "profile account team members settings" },
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setSearchOpen(false)}>
      <div className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden animate-fade-in" style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "var(--border-default)" }}>
          <svg className="h-5 w-5 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, features, settings..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {Object.entries(grouped).length > 0 ? (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{category}</p>
                {items.map((item) => (
                  <button key={item.path} onClick={() => handleSelect(item.path)} type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer hover:bg-[var(--accent-soft)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span className="flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
