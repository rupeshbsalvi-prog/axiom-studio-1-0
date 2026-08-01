import React, { useState, useRef } from "react";
import { colors, spacing, typography, radius, elevation } from "@axiom/tokens";
import {
  Slot,
  useId,
  isReducedMotionPreferred,
  useFocusTrap,
  FocusScope,
  FocusTrap,
  RestoreFocus,
  useOutsideClick,
  useRovingTabIndex,
  useInputModality,
} from "@axiom/ui-foundation";
import {
  Surface,
  Text,
  Stack,
  Grid,
  useBreakpoint,
  Divider,
  Icon,
  Badge,
  Button,
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@axiom/ui-core";
import "./index.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "components" | "typography" | "layout" | "accessibility" | "responsive" | "navigation" | "overlay"
  >("components");

  const modality = useInputModality();
  const bp = useBreakpoint();
  const isReducedMotion = isReducedMotionPreferred();
  const inputId = useId("associated-input");

  // -------------------------------------------------------------
  // TAB 1: Components States & Refs
  // -------------------------------------------------------------
  const [surfGlowing, setSurfGlowing] = useState(false);
  const [btnActive, setBtnActive] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [surfRefInfo, setSurfRefInfo] = useState("Not checked");

  const testSurfRef = useRef<HTMLDivElement>(null);
  const checkSurfRef = () => {
    if (testSurfRef.current) {
      setSurfRefInfo(
        `Tag: ${testSurfRef.current.tagName}, ClassName: ${testSurfRef.current.className}, Width: ${testSurfRef.current.offsetWidth}px`
      );
    }
  };

  // -------------------------------------------------------------
  // TAB 4: Accessibility State
  // -------------------------------------------------------------
  const [isTrapActive, setIsTrapActive] = useState(false);
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(trapRef, isTrapActive);

  const [isScopeActive, setIsScopeActive] = useState(false);

  const [outsideClickCount, setOutsideClickCount] = useState(0);
  const outsideRef = useRef<HTMLDivElement>(null);
  useOutsideClick(outsideRef, () => {
    setOutsideClickCount((c) => c + 1);
  });

  // -------------------------------------------------------------
  // TAB 6: Keyboard Roving Index
  // -------------------------------------------------------------
  const rovingRef = useRef<HTMLDivElement>(null);
  const { getTabIndex } = useRovingTabIndex(rovingRef, "[tabindex]");

  // -------------------------------------------------------------
  // LAYOUT DEMONSTRATION CONTROLS
  // -------------------------------------------------------------
  const [stackDir, setStackDir] = useState<"column" | "row">("row");
  const [stackGap, setStackGap] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [stackAlign, setStackAlign] = useState<"start" | "center" | "end" | "stretch">("center");
  const [stackJustify, setStackJustify] = useState<"start" | "center" | "end" | "between">("start");

  const [gridCols, setGridCols] = useState<number>(3);
  const [gridGap, setGridGap] = useState<"sm" | "md" | "lg" | "xl">("md");

  return (
    <div
      style={{
        padding: spacing.layout.sm,
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: typography.fonts.body,
        color: colors.text,
        backgroundColor: colors.background,
        minHeight: "100vh",
      }}
      data-input-modality={modality}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: spacing.md,
          marginBottom: spacing.xl,
        }}
      >
        <Stack direction="row" align="center" justify="between" wrap>
          <Stack gap="xxs">
            <Text variant="display" color="primary">
              Axiom Studio Workspace
            </Text>
            <Text variant="caption" color="muted">
              Sprint 2B Integration Workspace • Interactive Validation Core
            </Text>
          </Stack>
          <Surface
            variant="glass"
            style={{
              padding: `${spacing.xxs} ${spacing.sm}`,
              borderRadius: radius.full,
              display: "flex",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: colors.optimal,
                boxShadow: `0 0 8px ${colors.optimal}`,
              }}
            />
            <Text variant="mono" style={{ fontSize: typography.fontSizes.xs }}>
              Modality: {modality}
            </Text>
          </Surface>
        </Stack>
      </header>

      {/* Tabs Navigation */}
      <nav
        style={{
          display: "flex",
          gap: spacing.xs,
          marginBottom: spacing.xl,
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: spacing.xs,
          flexWrap: "wrap",
        }}
      >
        {(
          [
            { id: "components", label: "Component Gallery" },
            { id: "typography", label: "Typography Showcase" },
            { id: "layout", label: "Layout Demonstrations" },
            { id: "accessibility", label: "Accessibility Validation" },
            { id: "responsive", label: "Responsive Validation" },
            { id: "navigation", label: "Keyboard Navigation" },
            { id: "overlay", label: "Overlay Validation" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === tab.id ? colors.primary : colors.muted,
              borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : "2px solid transparent",
              padding: `${spacing.xs} ${spacing.md}`,
              fontFamily: typography.fonts.heading,
              fontSize: typography.fontSizes.sm,
              fontWeight: typography.fontWeights.semibold,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main style={{ minHeight: "500px" }}>
        {/* 1. Component Gallery */}
        {activeTab === "components" && (
          <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
            <Stack gap="md">
              <Text variant="title">Surface Panel Variants</Text>
              <Text variant="body" color="muted">
                Demonstrating structural card styling and semantic properties from tokens.
              </Text>

              <Surface variant="default" style={{ padding: spacing.md }}>
                <Text variant="label">Default Surface</Text>
                <Text variant="caption">Standard theme card styling</Text>
              </Surface>

              <Surface variant="elevated" style={{ padding: spacing.md }}>
                <Text variant="label">Elevated Surface</Text>
                <Text variant="caption">Card with distinct shadow drop</Text>
              </Surface>

              <Surface variant="outline" style={{ padding: spacing.md }}>
                <Text variant="label">Outline Surface</Text>
                <Text variant="caption">Transparent card with accent boundary</Text>
              </Surface>

              <Surface variant="glass" style={{ padding: spacing.md }}>
                <Text variant="label">Glass Surface</Text>
                <Text variant="caption">Frosted glassmorphism background and filter</Text>
              </Surface>

              <Surface
                variant="interactive"
                glowing={surfGlowing}
                ref={testSurfRef}
                onClick={checkSurfRef}
                style={{ padding: spacing.md }}
              >
                <Text variant="label" color="primary">
                  Interactive & Glow Surface
                </Text>
                <Text variant="caption">Click to test ref capture</Text>
              </Surface>
            </Stack>

            <Stack gap="md">
              <Text variant="title">Polymorphism & Controls</Text>
              <Text variant="body" color="muted">
                Configure rendering behaviors and track references.
              </Text>

              <Surface variant="default" style={{ padding: spacing.md }}>
                <Stack gap="md">
                  <Text variant="label">Ref Monitor</Text>
                  <Text variant="mono" style={{ fontSize: typography.fontSizes.xs }}>
                    {surfRefInfo}
                  </Text>
                  <button
                    onClick={checkSurfRef}
                    style={{
                      background: colors.primary,
                      color: colors.background,
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: radius.sm,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Resolve Interactive Ref
                  </button>

                  <hr style={{ borderColor: colors.border, margin: `${spacing.xs} 0` }} />

                  <Text variant="label">Interactive Glow Control</Text>
                  <label style={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
                    <input
                      type="checkbox"
                      checked={surfGlowing}
                      onChange={(e) => setSurfGlowing(e.target.checked)}
                    />
                    Enable Neural Glow
                  </label>
                </Stack>
              </Surface>

              <Surface variant="glass" style={{ padding: spacing.md }}>
                <Stack gap="sm">
                  <Text variant="label">Polymorphic Tag Test</Text>
                  <Surface as="button" variant="interactive" style={{ padding: spacing.sm, width: "100%", textAlign: "left" }} onClick={() => alert("Rendered as button!")}>
                    <Text variant="body">Rendered as &lt;button&gt;</Text>
                  </Surface>
                  <Surface as="a" href="#href-test" variant="interactive" style={{ padding: spacing.sm, display: "block", textDecoration: "none" }}>
                    <Text variant="body">Rendered as &lt;a&gt; link</Text>
                  </Surface>
                </Stack>
              </Surface>
            </Stack>

            <Stack gap="md">
              <Text variant="title">Interactive Primitives (Sprint 3)</Text>
              <Text variant="body" color="muted">
                Demonstrating Buttons, Badges, Icons, and Dividers with token-driven styles.
              </Text>

              <Surface variant="default" style={{ padding: spacing.md }}>
                <Stack gap="md">
                  <Text variant="label">Button Controls</Text>
                  <Stack direction="row" gap="md">
                    <label style={{ display: "flex", alignItems: "center", gap: spacing.xs, fontSize: "0.875rem" }}>
                      <input
                        type="checkbox"
                        checked={btnDisabled}
                        onChange={(e) => setBtnDisabled(e.target.checked)}
                      />
                      Disabled
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: spacing.xs, fontSize: "0.875rem" }}>
                      <input
                        type="checkbox"
                        checked={btnLoading}
                        onChange={(e) => setBtnLoading(e.target.checked)}
                      />
                      Loading
                    </label>
                  </Stack>

                  <Divider spacing="xs" />

                  <Stack gap="xs">
                    <Button variant="primary" disabled={btnDisabled} loading={btnLoading} onClick={() => alert("Primary button clicked!")}>
                      Primary
                    </Button>
                    <Button variant="secondary" disabled={btnDisabled} loading={btnLoading} onClick={() => alert("Secondary button clicked!")}>
                      Secondary
                    </Button>
                    <Button variant="ghost" disabled={btnDisabled} loading={btnLoading} onClick={() => alert("Ghost button clicked!")}>
                      Ghost
                    </Button>
                    <Button variant="destructive" disabled={btnDisabled} loading={btnLoading} onClick={() => alert("Destructive button clicked!")}>
                      Destructive
                    </Button>
                  </Stack>
                </Stack>
              </Surface>

              <Surface variant="default" style={{ padding: spacing.md }}>
                <Stack gap="sm">
                  <Text variant="label">Badge Variants & Sizes</Text>
                  <Stack direction="row" gap="xs" wrap>
                    <Badge variant="neutral">Neutral</Badge>
                    <Badge variant="optimal" dot>Optimal</Badge>
                    <Badge variant="warning" icon="warning">Warning</Badge>
                    <Badge variant="error" size="sm">Error</Badge>
                    <Badge variant="info" size="sm" icon="info">Info</Badge>
                  </Stack>
                </Stack>
              </Surface>

              <Surface variant="default" style={{ padding: spacing.md }}>
                <Stack gap="sm">
                  <Text variant="label">Icon & Divider</Text>
                  <Stack direction="row" gap="md" align="center">
                    <Icon name="check" color="optimal" size={20} label="Check" />
                    <Icon name="close" color="critical" size={20} label="Close" />
                    <Icon name="warning" color="attention" size={20} label="Warning" />
                    <Icon name="success" color="optimal" size={20} label="Success" />
                    <Icon name="info" color="primary" size={20} label="Info" />
                    <Icon name="spinner" color="primary" size={20} label="Spinner" />
                  </Stack>
                  <Divider spacing="sm" label="Labeled Divider" />
                  <Stack direction="row" align="center" style={{ height: "40px" }} gap="md">
                    <Text variant="caption">Start</Text>
                    <Divider orientation="vertical" spacing="none" />
                    <Text variant="caption">End</Text>
                  </Stack>
                </Stack>
              </Surface>
            </Stack>
          </Grid>
        )}

        {/* 2. Typography Showcase */}
        {activeTab === "typography" && (
          <Surface variant="default" style={{ padding: spacing.xl }}>
            <Stack gap="lg">
              <Text variant="title">Semantic Typography Scales</Text>
              <Text variant="body" color="muted">
                Typographic primitives are restricted to design tokens for weights, letter spacing, and line heights.
              </Text>

              <hr style={{ borderColor: colors.border, width: "100%" }} />

              <Stack gap="xs">
                <Text variant="caption">hero scale</Text>
                <Text variant="hero">Neural Core Active</Text>
              </Stack>

              <Stack gap="xs">
                <Text variant="caption">display scale</Text>
                <Text variant="display">Axiom Studio IDE</Text>
              </Stack>

              <Stack gap="xs">
                <Text variant="caption">title scale</Text>
                <Text variant="title">Sub-system calibration panel</Text>
              </Stack>

              <Stack gap="xs">
                <Text variant="caption">body scale</Text>
                <Text variant="body">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.
                  Sed cursus ante dapibus diam.
                </Text>
              </Stack>

              <Stack gap="xs">
                <Text variant="caption">label scale</Text>
                <Text variant="label">SYSTEM_READY_FLAG</Text>
              </Stack>

              <Stack gap="xs">
                <Text variant="caption">mono scale</Text>
                <Text variant="mono">npx vitest run packages/ui-core --coverage</Text>
              </Stack>

              <Stack gap="xs">
                <Text variant="caption">caption scale</Text>
                <Text variant="caption">Compiled successfully in 128ms.</Text>
              </Stack>

              <hr style={{ borderColor: colors.border, width: "100%" }} />

              <Text variant="title">Color & Alignment Overrides</Text>
              <Grid columns={2} gap="md">
                <Surface variant="glass" style={{ padding: spacing.md }}>
                  <Stack gap="xs">
                    <Text color="primary">primary color</Text>
                    <Text color="optimal">optimal (healthy teal)</Text>
                    <Text color="attention">attention (warning amber)</Text>
                    <Text color="critical">critical (failure red)</Text>
                    <Text color="highlight">highlight (accent gold)</Text>
                  </Stack>
                </Surface>
                <Surface variant="glass" style={{ padding: spacing.md }}>
                  <Stack gap="xs">
                    <Text align="left">Left aligned text</Text>
                    <Text align="center">Center aligned text</Text>
                    <Text align="right">Right aligned text</Text>
                  </Stack>
                </Surface>
              </Grid>
            </Stack>
          </Surface>
        )}

        {/* 3. Layout Demonstrations */}
        {activeTab === "layout" && (
          <Stack gap="xl">
            {/* Stack Section */}
            <Surface variant="default" style={{ padding: spacing.lg }}>
              <Stack gap="md">
                <Text variant="title">Stack Layout Control</Text>
                <Text variant="body" color="muted">
                  Interactive configuration for Flex Stack direction, alignment, gap, and wrapping.
                </Text>

                <Grid columns={{ mobile: 1, tablet: 4 }} gap="md">
                  <Stack gap="xxs">
                    <Text variant="label">Direction</Text>
                    <select
                      value={stackDir}
                      onChange={(e) => setStackDir(e.target.value as any)}
                      style={{ background: "#222", color: "#fff", padding: "6px", border: "1px solid #44" }}
                    >
                      <option value="row">row</option>
                      <option value="column">column</option>
                    </select>
                  </Stack>

                  <Stack gap="xxs">
                    <Text variant="label">Gap Scale</Text>
                    <select
                      value={stackGap}
                      onChange={(e) => setStackGap(e.target.value as any)}
                      style={{ background: "#222", color: "#fff", padding: "6px", border: "1px solid #44" }}
                    >
                      <option value="sm">sm (12px)</option>
                      <option value="md">md (16px)</option>
                      <option value="lg">lg (20px)</option>
                      <option value="xl">xl (24px)</option>
                    </select>
                  </Stack>

                  <Stack gap="xxs">
                    <Text variant="label">Align Items</Text>
                    <select
                      value={stackAlign}
                      onChange={(e) => setStackAlign(e.target.value as any)}
                      style={{ background: "#222", color: "#fff", padding: "6px", border: "1px solid #44" }}
                    >
                      <option value="start">start</option>
                      <option value="center">center</option>
                      <option value="end">end</option>
                      <option value="stretch">stretch</option>
                    </select>
                  </Stack>

                  <Stack gap="xxs">
                    <Text variant="label">Justify Content</Text>
                    <select
                      value={stackJustify}
                      onChange={(e) => setStackJustify(e.target.value as any)}
                      style={{ background: "#222", color: "#fff", padding: "6px", border: "1px solid #44" }}
                    >
                      <option value="start">start</option>
                      <option value="center">center</option>
                      <option value="end">end</option>
                      <option value="between">space-between</option>
                    </select>
                  </Stack>
                </Grid>

                <Surface
                  variant="glass"
                  style={{
                    padding: spacing.md,
                    marginTop: spacing.md,
                    minHeight: "150px",
                  }}
                >
                  <Stack
                    direction={stackDir}
                    gap={stackGap}
                    align={stackAlign}
                    justify={stackJustify}
                    style={{ height: "100%" }}
                  >
                    <Surface variant="outline" style={{ padding: "10px 20px" }}>
                      <Text variant="body">Box 1</Text>
                    </Surface>
                    <Surface variant="outline" style={{ padding: "15px 30px" }}>
                      <Text variant="body">Box 2</Text>
                    </Surface>
                    <Surface variant="outline" style={{ padding: "10px 15px" }}>
                      <Text variant="body">Box 3</Text>
                    </Surface>
                  </Stack>
                </Surface>
              </Stack>
            </Surface>

            {/* Grid Section */}
            <Surface variant="default" style={{ padding: spacing.lg }}>
              <Stack gap="md">
                <Text variant="title">Grid Layout Control</Text>
                <Text variant="body" color="muted">
                  Interactive configurations of CSS grid columns and gaps.
                </Text>

                <Grid columns={{ mobile: 1, tablet: 2 }} gap="md">
                  <Stack gap="xxs">
                    <Text variant="label">Grid Columns Count</Text>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={gridCols}
                      onChange={(e) => setGridCols(parseInt(e.target.value, 10) || 1)}
                      style={{ background: "#222", color: "#fff", padding: "6px", border: "1px solid #44" }}
                    />
                  </Stack>

                  <Stack gap="xxs">
                    <Text variant="label">Grid Gap Scale</Text>
                    <select
                      value={gridGap}
                      onChange={(e) => setGridGap(e.target.value as any)}
                      style={{ background: "#222", color: "#fff", padding: "6px", border: "1px solid #44" }}
                    >
                      <option value="sm">sm (12px)</option>
                      <option value="md">md (16px)</option>
                      <option value="lg">lg (20px)</option>
                      <option value="xl">xl (24px)</option>
                    </select>
                  </Stack>
                </Grid>

                <Surface
                  variant="glass"
                  style={{
                    padding: spacing.md,
                    marginTop: spacing.md,
                  }}
                >
                  <Grid columns={gridCols} gap={gridGap}>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Surface key={index} variant="outline" style={{ padding: spacing.md, textAlign: "center" }}>
                        <Text variant="body">Cell {index + 1}</Text>
                      </Surface>
                    ))}
                  </Grid>
                </Surface>
              </Stack>
            </Surface>
          </Stack>
        )}

        {/* 4. Accessibility Validation */}
        {activeTab === "accessibility" && (
          <Grid columns={{ mobile: 1, tablet: 2 }} gap="lg">
            <Stack gap="md">
              <Text variant="title">Focus Trap Loop</Text>
              <Text variant="body" color="muted">
                Toggling Focus Trap confines focus traversal strictly inside the container block.
              </Text>

              <Surface variant="glass" style={{ padding: spacing.md }}>
                <Stack gap="md">
                  <button
                    onClick={() => setIsTrapActive(!isTrapActive)}
                    style={{
                      background: isTrapActive ? colors.critical : colors.primary,
                      color: colors.background,
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: radius.sm,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {isTrapActive ? "Deactivate Focus Trap" : "Activate Focus Trap"}
                  </button>

                  <div
                    ref={trapRef}
                    style={{
                      padding: spacing.md,
                      border: isTrapActive ? `2px solid ${colors.critical}` : `1px dashed ${colors.border}`,
                      borderRadius: radius.md,
                      backgroundColor: "rgba(255, 0, 0, 0.02)",
                    }}
                  >
                    <Stack gap="sm">
                      <Text variant="label">Trapped Container</Text>
                      <input placeholder="Trapped Field 1" style={{ padding: "6px", background: "#333", color: "#fff", border: "1px solid #555" }} />
                      <input placeholder="Trapped Field 2" style={{ padding: "6px", background: "#333", color: "#fff", border: "1px solid #555" }} />
                      <button style={{ padding: "6px", cursor: "pointer" }}>Trapped Action Button</button>
                    </Stack>
                  </div>
                </Stack>
              </Surface>
            </Stack>

            <Stack gap="md">
              <Text variant="title">Outside Click Handler</Text>
              <Text variant="body" color="muted">
                Clicking outside the target container triggers a visual counter increment.
              </Text>

              <div ref={outsideRef}>
                <Surface
                  variant="glass"
                  style={{
                    padding: spacing.xl,
                    border: `1px solid ${colors.highlight}`,
                    textAlign: "center",
                    backgroundColor: "rgba(231, 196, 129, 0.02)",
                  }}
                >
                  <Text variant="label" color="highlight">
                    Outside Click Sensor Panel
                  </Text>
                  <Text variant="display" style={{ marginTop: spacing.md }}>
                    {outsideClickCount}
                  </Text>
                  <Text variant="caption" color="muted">
                    Clicks recorded outside this box
                  </Text>
                </Surface>
              </div>
            </Stack>
          </Grid>
        )}

        {/* 5. Responsive Validation */}
        {activeTab === "responsive" && (
          <Stack gap="lg">
            <Text variant="title">Responsive Fluid Layouts</Text>
            <Text variant="body" color="muted">
              Resize your browser viewport width to see Stack layout directions, gap widths, and Grid columns templates adapt dynamically based on breakpoint tokens.
            </Text>

            <Surface variant="glass" style={{ padding: spacing.md }}>
              <Stack direction="row" justify="between" align="center">
                <Text variant="label">Current Viewport Category</Text>
                <Surface
                  variant="default"
                  style={{
                    padding: "4px 12px",
                    borderColor: colors.primary,
                    borderRadius: radius.sm,
                  }}
                >
                  <Text variant="mono" color="primary">
                    {bp.toUpperCase()}
                  </Text>
                </Surface>
              </Stack>
            </Surface>

            <Surface variant="default" style={{ padding: spacing.md }}>
              <Text variant="label" style={{ marginBottom: spacing.sm }}>
                Responsive Flex Stack (Column on Mobile, Row on Tablet+)
              </Text>
              <Stack
                direction={{ mobile: "column", tablet: "row" }}
                gap={{ mobile: "sm", tablet: "md", desktop: "xl" }}
              >
                <Surface variant="outline" style={{ flex: 1, padding: spacing.md }}>
                  <Text variant="body">Responsive Block A</Text>
                </Surface>
                <Surface variant="outline" style={{ flex: 1, padding: spacing.md }}>
                  <Text variant="body">Responsive Block B</Text>
                </Surface>
                <Surface variant="outline" style={{ flex: 1, padding: spacing.md }}>
                  <Text variant="body">Responsive Block C</Text>
                </Surface>
              </Stack>
            </Surface>

            <Surface variant="default" style={{ padding: spacing.md }}>
              <Text variant="label" style={{ marginBottom: spacing.sm }}>
                Responsive CSS Grid (1 Column on Mobile, 2 on Tablet, 4 on Desktop)
              </Text>
              <Grid
                columns={{ mobile: 1, tablet: 2, desktop: 4 }}
                gap={{ mobile: "sm", tablet: "md" }}
              >
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Surface key={idx} variant="outline" style={{ padding: spacing.md, textAlign: "center" }}>
                    <Text variant="body">Cell {idx + 1}</Text>
                  </Surface>
                ))}
              </Grid>
            </Surface>
          </Stack>
        )}

        {/* 6. Keyboard Navigation */}
        {activeTab === "navigation" && (
          <Grid columns={{ mobile: 1, tablet: 2 }} gap="lg">
            <Stack gap="md">
              <Text variant="title">Roving TabIndex Toolbar</Text>
              <Text variant="body" color="muted">
                Navigate the toolbar buttons using the left/right arrow keys. Focus moves properly and updates the active tab index.
              </Text>

              <Surface variant="glass" style={{ padding: spacing.md }}>
                <div
                  ref={rovingRef}
                  style={{
                    display: "flex",
                    gap: spacing.sm,
                    padding: spacing.sm,
                    backgroundColor: "#111",
                    borderRadius: radius.md,
                  }}
                >
                  <button
                    tabIndex={getTabIndex(0)}
                    className="roving-item"
                    style={{
                      padding: "8px 12px",
                      background: "#222",
                      color: "#fff",
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.sm,
                      cursor: "pointer",
                    }}
                  >
                    Action One
                  </button>
                  <button
                    tabIndex={getTabIndex(1)}
                    className="roving-item"
                    style={{
                      padding: "8px 12px",
                      background: "#222",
                      color: "#fff",
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.sm,
                      cursor: "pointer",
                    }}
                  >
                    Action Two
                  </button>
                  <button
                    tabIndex={getTabIndex(2)}
                    className="roving-item"
                    style={{
                      padding: "8px 12px",
                      background: "#222",
                      color: "#fff",
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.sm,
                      cursor: "pointer",
                    }}
                  >
                    Action Three
                  </button>
                </div>
              </Surface>
            </Stack>

            <Stack gap="md">
              <Text variant="title">FocusScope Dialog Simulation</Text>
              <Text variant="body" color="muted">
                Entering the scoped overlay mounts an active FocusScope with auto-focus and restoration.
              </Text>

              <Surface variant="glass" style={{ padding: spacing.md }}>
                <Stack gap="md">
                  <button
                    onClick={() => setIsScopeActive(!isScopeActive)}
                    style={{
                      background: colors.primary,
                      color: colors.background,
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: radius.sm,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {isScopeActive ? "Unmount FocusScope" : "Mount FocusScope Overlay"}
                  </button>

                  {isScopeActive && (
                    <RestoreFocus>
                      <FocusScope autoFocus>
                        <FocusTrap>
                          <Surface
                            variant="elevated"
                            style={{
                              padding: spacing.md,
                              border: `2px solid ${colors.primary}`,
                            }}
                          >
                            <Stack gap="sm">
                              <Text variant="label" color="primary">
                                Scoped Zone Dialog
                              </Text>
                              <input
                                placeholder="First focused input"
                                style={{ padding: "6px", background: "#333", color: "#fff", border: "1px solid #555" }}
                              />
                              <input
                                placeholder="Second field"
                                style={{ padding: "6px", background: "#333", color: "#fff", border: "1px solid #555" }}
                              />
                              <button
                                onClick={() => setIsScopeActive(false)}
                                style={{ padding: "6px", cursor: "pointer", background: colors.primary, border: "none", color: "#000" }}
                              >
                                Close & Restore Focus
                              </button>
                            </Stack>
                          </Surface>
                        </FocusTrap>
                      </FocusScope>
                    </RestoreFocus>
                  )}
                </Stack>
              </Surface>
            </Stack>
          </Grid>
        )}

        {/* 7. Overlay Validation */}
        {activeTab === "overlay" && (
          <OverlayValidator />
        )}
      </main>
    </div>
  );
}

function OverlayValidator() {
  const [dialog1Open, setDialog1Open] = useState(false);
  const [dialog2Open, setDialog2Open] = useState(false);
  const [rapidOpen, setRapidOpen] = useState(false);

  const handleRapidToggle = () => {
    let count = 0;
    const interval = setInterval(() => {
      setRapidOpen((prev) => !prev);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setRapidOpen(false);
      }
    }, 100);
  };

  return (
    <Stack gap="lg">
      <Text variant="title">Overlay & Dialog Stress Testing</Text>
      <Text variant="body" color="muted">
        Verify nested overlays, scroll lock state, escape key sequences, and rapid open/close cycles.
      </Text>

      <Surface variant="default" style={{ padding: spacing.lg }}>
        <Stack gap="md">
          <Text variant="label">Stress Testing Actions</Text>
          <Stack direction="row" gap="md" wrap>
            <Button variant="primary" onClick={() => setDialog1Open(true)}>
              Open Dialog 1 (Parent)
            </Button>
            <Button variant="secondary" onClick={handleRapidToggle}>
              Rapid Open/Close Cycle
            </Button>
          </Stack>
        </Stack>
      </Surface>

      {/* Dialog 1 (Parent) */}
      <Dialog open={dialog1Open} onOpenChange={setDialog1Open}>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Dialog 1: Parent Overlay</DialogTitle>
          <DialogDescription>
            This dialog locks body scrolling and traps focus. Click the button below to launch a nested child dialog.
          </DialogDescription>
          <Stack gap="md">
            <input
              placeholder="Focused in Dialog 1"
              style={{ padding: "8px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "4px" }}
            />
            <Stack direction="row" gap="sm">
              <Button variant="primary" onClick={() => setDialog2Open(true)}>
                Open Dialog 2 (Nested)
              </Button>
              <Button variant="ghost" onClick={() => setDialog1Open(false)}>
                Close
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Dialog 2 (Nested Child) */}
      <Dialog open={dialog2Open} onOpenChange={setDialog2Open}>
        <DialogOverlay style={{ zIndex: 499, backgroundColor: "rgba(0, 0, 0, 0.6)" }} />
        <DialogContent style={{ zIndex: 500, border: `1px solid ${colors.highlight}` }}>
          <DialogTitle>Dialog 2: Nested Child</DialogTitle>
          <DialogDescription>
            A second dialog layered over the first one. Pressing Escape here should close ONLY this dialog, restoring focus back to Dialog 1.
          </DialogDescription>
          <Stack gap="md">
            <input
              placeholder="Focused in Dialog 2"
              style={{ padding: "8px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "4px" }}
            />
            <Button variant="ghost" onClick={() => setDialog2Open(false)}>
              Close Nested
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Rapid Toggle Test Dialog */}
      <Dialog open={rapidOpen} onOpenChange={setRapidOpen}>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Rapid Toggle Test</DialogTitle>
          <DialogDescription>This dialog is rapidly mounting and unmounting.</DialogDescription>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

