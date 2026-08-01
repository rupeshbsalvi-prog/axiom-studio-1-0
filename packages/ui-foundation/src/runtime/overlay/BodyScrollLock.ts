let lockCount = 0;
let originalOverflow = "";
let originalPaddingRight = "";

export const BodyScrollLock = {
  lock(): void {
    if (typeof document === "undefined") return;

    if (lockCount === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      if (scrollbarWidth > 0) {
        // Prevent layout shift by adding padding equal to scrollbar width
        const currentPadding = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
        document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      }
      document.body.style.overflow = "hidden";
    }
    lockCount++;
  },

  unlock(): void {
    if (typeof document === "undefined") return;

    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    }
  },
};
