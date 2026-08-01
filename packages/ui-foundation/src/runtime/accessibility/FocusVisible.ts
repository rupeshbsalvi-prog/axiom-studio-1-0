import { useEffect, useState } from "react";

export function useFocusVisible(): boolean {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    let active = false;

    const handleKeyDown = () => {
      active = true;
    };
    const handlePointerDown = () => {
      active = false;
      setIsFocusVisible(false);
    };
    const handleFocus = () => {
      if (active) setIsFocusVisible(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("focusin", handleFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("focusin", handleFocus);
    };
  }, []);

  return isFocusVisible;
}
