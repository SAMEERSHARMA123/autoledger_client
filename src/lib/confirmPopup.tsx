"use client";

import { createRoot } from "react-dom/client";

export const confirmPopup = (message: string, title = "Confirm Action"): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(false);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const close = (result: boolean) => {
      root.unmount();
      container.remove();
      resolve(result);
    };

    root.render(
      <div className="fixed inset-0 z- bg-black/75 flex items-center justify-center p-4">
        <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] w-full max-w-sm p-6 shadow-[4px_4px_0px_0px_var(--color-amber)] text-[var(--color-coolwhite)]">
          <h3 className="font-sans font-bold text-base uppercase border-b border-zinc-800 pb-2 mb-3">
            {title}
          </h3>
          <p className="font-mono text-xs text-zinc-300 mb-6 leading-relaxed">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => close(false)}
              className="px-4 py-2 bg-[var(--color-charcoal)] border border-zinc-700 font-mono text-xs uppercase hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => close(true)}
              className="px-4 py-2 bg-[var(--color-crimson)] text-white font-sans font-bold text-xs uppercase cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  });
};
