import { useState, useEffect, RefObject } from "react";

export function useRovingTabIndex(
  containerRef: RefObject<HTMLElement | null>,
  itemSelector: string,
  orientation: "horizontal" | "vertical" | "both" = "both"
) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
      if (items.length === 0) return;

      let nextIndex = activeIndex;

      const isHorizontal = orientation === "horizontal" || orientation === "both";
      const isVertical = orientation === "vertical" || orientation === "both";

      if (isHorizontal && event.key === "ArrowRight") {
        nextIndex = (activeIndex + 1) % items.length;
      } else if (isHorizontal && event.key === "ArrowLeft") {
        nextIndex = (activeIndex - 1 + items.length) % items.length;
      } else if (isVertical && event.key === "ArrowDown") {
        nextIndex = (activeIndex + 1) % items.length;
      } else if (isVertical && event.key === "ArrowUp") {
        nextIndex = (activeIndex - 1 + items.length) % items.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = items.length - 1;
      } else {
        return; // Non-navigation key
      }

      event.preventDefault();
      setActiveIndex(nextIndex);
      items[nextIndex]?.focus();
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, itemSelector, orientation, activeIndex]);

  return {
    activeIndex,
    setActiveIndex,
    getTabIndex: (index: number) => (index === activeIndex ? 0 : -1),
  };
}
