import { useState, useEffect } from "react";

export type InputModality = "pointer" | "keyboard";

let globalModality: InputModality = "pointer";
const listeners = new Set<(modality: InputModality) => void>();

let hasSetup = false;
function setupGlobalListener() {
  if (hasSetup || typeof window === "undefined") return;
  hasSetup = true;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return;
    updateModality("keyboard");
  };

  const handlePointerDown = () => {
    updateModality("pointer");
  };

  window.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("pointerdown", handlePointerDown, true);
  window.addEventListener("mousedown", handlePointerDown, true);
  window.addEventListener("touchstart", handlePointerDown, true);

  if (document.documentElement) {
    document.documentElement.setAttribute("data-input-modality", globalModality);
  }
}

function updateModality(newModality: InputModality) {
  if (globalModality === newModality) return;
  globalModality = newModality;
  if (document.documentElement) {
    document.documentElement.setAttribute("data-input-modality", newModality);
  }
  listeners.forEach((listener) => listener(newModality));
}

export function useInputModality(): InputModality {
  const [modality, setModality] = useState<InputModality>(globalModality);

  useEffect(() => {
    setupGlobalListener();

    const listener = (newModality: InputModality) => {
      setModality(newModality);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return modality;
}
