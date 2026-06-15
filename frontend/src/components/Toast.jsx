import { useEffect, useState } from "react";
import "../pages/css/Toast.css";

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      const id = Date.now() + Math.random();
      const toast = {
        id,
        type: detail.type || "info",
        text: detail.text || "",
      };
      setToasts((t) => [...t, toast]);

      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, detail.timeout || 4000);
    };

    window.addEventListener("show-toast", handler);

    window.showToast = (payload) =>
      window.dispatchEvent(new CustomEvent("show-toast", { detail: payload }));
    return () => {
      window.removeEventListener("show-toast", handler);
      delete window.showToast;
    };
  }, []);

  return (
    <div className="toast-portal" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type === "success" ? "toast-success" : t.type === "error" ? "toast-error" : "toast-info"}`}
        >
          <div className="toast-body">{t.text}</div>
          <button
            className="toast-close"
            onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
