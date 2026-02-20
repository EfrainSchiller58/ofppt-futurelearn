import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { keys: ["Ctrl", "K"], desc: "Open global search" },
  { keys: ["?"], desc: "Show keyboard shortcuts" },
  { keys: ["Esc"], desc: "Close modals and panels" },
  { keys: ["G", "D"], desc: "Go to Dashboard" },
  { keys: ["G", "S"], desc: "Go to Students" },
  { keys: ["G", "T"], desc: "Go to Teachers" },
];

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const el = e.target as HTMLElement;
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") return;
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return createPortal(
    <>
      <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10020, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10021, width: "90vw", maxWidth: "420px" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-xl shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold">Keyboard Shortcuts</h2>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {shortcuts.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50"
              >
                <span className="text-sm text-muted-foreground">{s.desc}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd key={k} className="px-2 py-1 rounded border border-border bg-muted text-xs font-mono text-foreground">
                      {k}
                    </kbd>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-4">Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono">?</kbd> to toggle</p>
        </motion.div>
      </div>
    </>,
    document.body
  );
};

export default KeyboardShortcuts;
