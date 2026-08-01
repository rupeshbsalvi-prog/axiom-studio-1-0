import React, { useRef, useEffect } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  classNames,
  forwardRef,
  Slot,
  getVariantClassName,
  mapStateToDataAttributes,
  isActivationKey,
  handleEscape,
  handleArrowNavigation,
  getDisabledProps,
  mapAriaProps,
  useId,
  useFocusVisible,
  isReducedMotionPreferred,
  useFocusTrap,
  FocusScope,
  FocusTrap,
  RestoreFocus,
  useRestoreFocus,
  usePreviousFocus,
  useRovingTabIndex,
  useOutsideClick,
  useInputModality,
} from "../src/index";

// A dummy polymorphic component for testing
interface TestBoxProps {
  testProp?: string;
}

const TestBox = forwardRef<TestBoxProps, "div">(({ as: Tag = "div", testProp, ...props }, ref) => {
  return <Tag ref={ref} data-testid={testProp} {...props} />;
});
TestBox.displayName = "TestBox";

describe("Axiom UI Foundation Utilities", () => {
  
  describe("classNames()", () => {
    it("should merge strings, skip falsy elements, and handle nested arrays or objects", () => {
      expect(classNames("a", "b", null, undefined, false, "")).toBe("a b");
      expect(classNames("btn", { "btn--active": true, "btn--disabled": false })).toBe("btn btn--active");
      expect(classNames(["nested", ["deep", { active: true }]] as any)).toBe("nested deep active");
      expect(classNames([])).toBe("");
      expect(classNames([false, null, undefined] as any)).toBe("");
    });

    it("should pass performance checks for 10,000 iterations", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        classNames("btn", { "btn--active": i % 2 === 0, "btn--size-lg": true }, ["nested", "array"]);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Polymorphic Component and forwardRef", () => {
    it("should render default tag (div) and forward reference", () => {
      let refNode: HTMLDivElement | null = null;
      const TestComponent = () => {
        const boxRef = useRef<HTMLDivElement>(null);
        useEffect(() => {
          refNode = boxRef.current;
        }, []);
        return <TestBox ref={boxRef} testProp="box-test" />;
      };

      render(<TestComponent />);
      const el = screen.getByTestId("box-test");
      expect(el.tagName).toBe("DIV");
      expect(refNode).toBe(el);
    });

    it("should render alternate polymorphic tag (button) and forward ref", () => {
      let refNode: HTMLButtonElement | null = null;
      const TestComponent = () => {
        const boxRef = useRef<HTMLButtonElement>(null);
        useEffect(() => {
          refNode = boxRef.current;
        }, []);
        return <TestBox as="button" ref={boxRef} testProp="btn-test" type="button" />;
      };

      render(<TestComponent />);
      const el = screen.getByTestId("btn-test");
      expect(el.tagName).toBe("BUTTON");
      expect(el.getAttribute("type")).toBe("button");
      expect(refNode).toBe(el);
    });
  });

  describe("Slot component", () => {
    it("should merge external props onto child elements", () => {
      render(
        <Slot data-testid="slot-el" data-slot="parent" className="parent-class" style={{ color: "red" }}>
          <div className="child-class" style={{ fontSize: "14px" }}>
            Hello
          </div>
        </Slot>
      );

      const el = screen.getByTestId("slot-el");
      expect(el.getAttribute("data-slot")).toBe("parent");
      expect(el.className).toBe("parent-class child-class");
      expect(el.style.color).toBe("red");
      expect(el.style.fontSize).toBe("14px");
    });

    it("should forward both Slot ref and child ref", () => {
      let slotRefNode: HTMLDivElement | null = null;
      let childRefNode: HTMLDivElement | null = null;

      const TestComponent = () => {
        const slotRef = useRef<HTMLDivElement>(null);
        const childRef = useRef<HTMLDivElement>(null);
        useEffect(() => {
          slotRefNode = slotRef.current;
          childRefNode = childRef.current;
        }, []);

        return (
          <Slot ref={slotRef}>
            <div ref={childRef} data-testid="slot-ref-test">
              Slot
            </div>
          </Slot>
        );
      };

      render(<TestComponent />);
      const el = screen.getByTestId("slot-ref-test");
      expect(slotRefNode).toBe(el);
      expect(childRefNode).toBe(el);
    });

    it("should return null when slot contains invalid children", () => {
      // @ts-expect-error - testing invalid child rendering
      const { container } = render(<Slot>Not an element</Slot>);
      expect(container.firstChild).toBeNull();
    });

    it("should support function refs on both Slot and child elements", () => {
      let slotRefNode: HTMLDivElement | null = null;
      let childRefNode: HTMLDivElement | null = null;

      const slotRefFn = (node: HTMLDivElement | null) => {
        slotRefNode = node;
      };
      const childRefFn = (node: HTMLDivElement | null) => {
        childRefNode = node;
      };

      render(
        <Slot ref={slotRefFn}>
          <div ref={childRefFn} data-testid="fn-ref-test">
            Slot Function Ref
          </div>
        </Slot>
      );

      const el = screen.getByTestId("fn-ref-test");
      expect(slotRefNode).toBe(el);
      expect(childRefNode).toBe(el);
    });
  });

  describe("getVariantClassName()", () => {
    it("should build component-variant-size lookup class string", () => {
      expect(getVariantClassName("ax-btn")).toBe("ax-btn");
      expect(getVariantClassName("ax-btn", "primary")).toBe("ax-btn ax-btn--variant-primary");
      expect(getVariantClassName("ax-btn", "secondary", "lg")).toBe("ax-btn ax-btn--variant-secondary ax-btn--size-lg");
    });

    it("should pass performance checks for 10,000 iterations", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        getVariantClassName("ax-card", i % 2 === 0 ? "outline" : "solid", "md");
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe("mapStateToDataAttributes()", () => {
    it("should map truthy state values to data-* key attributes", () => {
      const states = {
        active: true,
        loading: false,
        disabled: undefined,
        currentStep: 3,
        hoveredState: "glow",
      };

      const attrs = mapStateToDataAttributes(states);
      expect(attrs["data-active"]).toBe("true");
      expect(attrs["data-loading"]).toBeUndefined();
      expect(attrs["data-disabled"]).toBeUndefined();
      expect(attrs["data-current-step"]).toBe("3");
      expect(attrs["data-hovered-state"]).toBe("glow");
    });
  });

  describe("Accessibility Helpers", () => {
    it("should accurately resolve key activation conditions", () => {
      const enterEvent = { key: "Enter" } as React.KeyboardEvent;
      const spaceEvent = { key: " " } as React.KeyboardEvent;
      const arrowEvent = { key: "ArrowUp" } as React.KeyboardEvent;

      expect(isActivationKey(enterEvent)).toBe(true);
      expect(isActivationKey(spaceEvent)).toBe(true);
      expect(isActivationKey(arrowEvent)).toBe(false);
    });

    it("should handle escape closures", () => {
      const callback = vi.fn();
      handleEscape({ key: "Escape" } as any, callback);
      expect(callback).toHaveBeenCalledTimes(1);

      handleEscape({ key: "Enter" } as any, callback);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should route arrow navigation appropriately", () => {
      const onUp = vi.fn();
      const onDown = vi.fn();
      const onLeft = vi.fn();
      const onRight = vi.fn();

      const options = { onUp, onDown, onLeft, onRight };

      handleArrowNavigation({ key: "ArrowUp" } as any, options);
      handleArrowNavigation({ key: "ArrowDown" } as any, options);
      handleArrowNavigation({ key: "ArrowLeft" } as any, options);
      handleArrowNavigation({ key: "ArrowRight" } as any, options);

      expect(onUp).toHaveBeenCalledTimes(1);
      expect(onDown).toHaveBeenCalledTimes(1);
      expect(onLeft).toHaveBeenCalledTimes(1);
      expect(onRight).toHaveBeenCalledTimes(1);
    });

    it("should generate proper disabled props", () => {
      expect(getDisabledProps(false)).toEqual({});
      expect(getDisabledProps(true)).toEqual({
        disabled: true,
        "aria-disabled": true,
        tabIndex: -1,
      });
    });

    it("should map aria properties accurately", () => {
      const props = {
        label: "Next Step",
        ariaExpanded: true,
        ariaHidden: false,
      };

      const mapped = mapAriaProps(props);
      expect(mapped["aria-label"]).toBe("Next Step");
      expect(mapped["aria-expanded"]).toBe(true);
      expect(mapped["aria-hidden"]).toBe(false);
    });

    it("should generate ids safely", () => {
      const TestComponent = () => {
        const id1 = useId("test");
        const id2 = useId();
        return <div data-id1={id1} data-id2={id2} data-testid="ids" />;
      };

      render(<TestComponent />);
      const el = screen.getByTestId("ids");
      expect(el.getAttribute("data-id1")).toMatch(/^test-/);
      expect(el.getAttribute("data-id2")).toBeDefined();
    });

    it("should resolve isReducedMotionPreferred correctly", () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      });

      expect(isReducedMotionPreferred()).toBe(true);

      window.matchMedia = vi.fn().mockImplementation(() => {
        return {
          matches: false,
        };
      });
      expect(isReducedMotionPreferred()).toBe(false);

      window.matchMedia = originalMatchMedia;
    });

    it("should detect focus visible state correctly on keydown/focusin and reset on pointerdown", () => {
      let isVisible = false;
      const TestComponent = () => {
        isVisible = useFocusVisible();
        return <button data-testid="btn">Test Focus</button>;
      };

      render(<TestComponent />);
      expect(isVisible).toBe(false);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
        window.dispatchEvent(new Event("focusin"));
      });
      expect(isVisible).toBe(true);

      act(() => {
        window.dispatchEvent(new PointerEvent("pointerdown"));
      });
      expect(isVisible).toBe(false);
    });
  });

  describe("Accessibility Extensions", () => {
    it("should manage focus trap loop on tab key", () => {
      const TestTrap = () => {
        const ref = useRef<HTMLDivElement>(null);
        useFocusTrap(ref, true);
        return (
          <div ref={ref} data-testid="trap">
            <button data-testid="b1">Btn1</button>
            <button data-testid="b2">Btn2</button>
          </div>
        );
      };

      render(<TestTrap />);
      const b1 = screen.getByTestId("b1");
      const b2 = screen.getByTestId("b2");

      b1.focus();
      expect(document.activeElement).toBe(b1);

      // Dispatch Shift-Tab on b1 - should wrap focus to b2
      const shiftTabEvent = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
      act(() => {
        b1.dispatchEvent(shiftTabEvent);
      });
      expect(document.activeElement).toBe(b2);
    });

    it("should handle FocusScope autoFocus and restoreFocus", () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      const TestScope = () => (
        <RestoreFocus>
          <FocusScope autoFocus>
            <FocusTrap>
              <button data-testid="sb1">Scope1</button>
              <button data-testid="sb2">Scope2</button>
            </FocusTrap>
          </FocusScope>
        </RestoreFocus>
      );

      const { unmount } = render(<TestScope />);
      const sb1 = screen.getByTestId("sb1");
      
      // Auto-focus should focus the first focusable node in scope
      expect(document.activeElement).toBe(sb1);

      unmount();
      // Restore focus should focus the trigger again
      expect(document.activeElement).toBe(trigger);
      document.body.removeChild(trigger);
    });

    it("should track roving tabIndex correctly", () => {
      const TestRoving = () => {
        const ref = useRef<HTMLDivElement>(null);
        const { getTabIndex } = useRovingTabIndex(ref, "[tabindex]");
        return (
          <div ref={ref} data-testid="roving">
            <span tabIndex={getTabIndex(0)} data-testid="item0">0</span>
            <span tabIndex={getTabIndex(1)} data-testid="item1">1</span>
          </div>
        );
      };

      render(<TestRoving />);
      const item0 = screen.getByTestId("item0");
      const item1 = screen.getByTestId("item1");

      expect(item0.tabIndex).toBe(0);
      expect(item1.tabIndex).toBe(-1);
    });

    it("should trigger outside click callback", () => {
      const callback = vi.fn();
      const TestOutside = () => {
        const ref = useRef<HTMLDivElement>(null);
        useOutsideClick(ref, callback);
        return (
          <div>
            <div ref={ref} data-testid="inside">Inside</div>
            <button data-testid="outside">Outside</button>
          </div>
        );
      };

      render(<TestOutside />);
      const inside = screen.getByTestId("inside");
      const outside = screen.getByTestId("outside");

      // Click inside - shouldn't trigger
      act(() => {
        inside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(callback).not.toHaveBeenCalled();

      // Click outside - should trigger
      act(() => {
        outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should detect input modality", () => {
      let currentModality = "";
      const TestModality = () => {
        const modality = useInputModality();
        currentModality = modality;
        return <div>{modality}</div>;
      };

      render(<TestModality />);
      expect(currentModality).toBe("pointer"); // default

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });
      expect(currentModality).toBe("keyboard");

      act(() => {
        window.dispatchEvent(new PointerEvent("pointerdown"));
      });
      expect(currentModality).toBe("pointer");
    });
  });
});
