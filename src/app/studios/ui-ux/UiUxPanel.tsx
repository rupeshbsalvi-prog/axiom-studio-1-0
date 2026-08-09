import { useState } from "react";

const screens = [
  { label: "Workspace home", title: "Welcome back, Rupesh", description: "Projects, recent activity, and creative entry points." },
  { label: "Project workspace", title: "Launch campaign", description: "Editable creative work with visible intelligence and governance." },
  { label: "Export review", title: "Ready for handoff", description: "Review formats, accessibility, and delivery evidence." },
] as const;

const viewports = [
  { id: "desktop", label: "Desktop", dimensions: "1440 × 1024" },
  { id: "tablet", label: "Tablet", dimensions: "834 × 1194" },
  { id: "mobile", label: "Mobile", dimensions: "390 × 844" },
] as const;

export function UiUxPanel() {
  const [selectedScreen, setSelectedScreen] = useState(0);
  const [selectedViewport, setSelectedViewport] = useState(0);
  const screen = screens[selectedScreen];
  const viewport = viewports[selectedViewport];

  return (
    <section
      className="studio-production-panel studio-production-panel--uiux"
      aria-label="UI/UX production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner" aria-label="UI/UX frames and components">
        <div className="uiux-panel-heading">
          <span>Product flow</span>
          <strong>Axiom Creator / 03</strong>
        </div>
        <button className="uiux-add-frame" type="button">+ Add frame</button>
        <div className="uiux-screen-list" aria-label="Product screens">
          {screens.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-label={`Screen ${index + 1}: ${item.label}`}
              aria-pressed={selectedScreen === index}
              onClick={() => setSelectedScreen(index)}
            >
              <span>0{index + 1}</span>
              <div><strong>{item.label}</strong><small>{item.description}</small></div>
            </button>
          ))}
        </div>
        <div className="uiux-component-summary">
          <span>Components</span>
          <strong>24 linked · 0 detached</strong>
          <small>Navigation, cards, controls, status, dialogs</small>
        </div>
      </aside>

      <section className="studio-panel-canvas uiux-canvas" aria-label="UI/UX product canvas">
        <div className="uiux-canvas-bar">
          <span>{screen.label}</span>
          <strong>{viewport.dimensions}</strong>
        </div>
        <div className="uiux-viewport-controls" aria-label="Responsive viewport controls">
          {viewports.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`${item.label} viewport`}
              aria-pressed={selectedViewport === index}
              onClick={() => setSelectedViewport(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="uiux-stage">
          <article className={`uiux-device uiux-device--${viewport.id}`}>
            <header><strong>Axiom</strong><span>⌘ K</span></header>
            <div className="uiux-product-body">
              <nav aria-label="Preview navigation"><i /><i /><i /></nav>
              <main>
                <p>{screen.label}</p>
                <h2>{screen.title}</h2>
                <span>{screen.description}</span>
                <div className="uiux-card-grid"><i /><i /><i /></div>
              </main>
            </div>
          </article>
        </div>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector" aria-label="UI/UX properties and handoff">
        <div className="uiux-panel-heading">
          <span>Design inspector</span>
          <strong>{screen.label}</strong>
        </div>
        <dl className="uiux-properties">
          <div><dt>Layout</dt><dd>12-column grid</dd></div>
          <div><dt>Spacing</dt><dd>8 px system</dd></div>
          <div><dt>Radius</dt><dd>12 px</dd></div>
          <div><dt>Contrast</dt><dd>AA · 7.8:1</dd></div>
        </dl>
        <div className="uiux-token-preview">
          <span>Design tokens</span>
          <code>surface/raised · text/primary · accent/intelligence</code>
        </div>
        <div className="uiux-handoff">
          <span>Handoff readiness</span>
          <p><strong>Pass</strong> Responsive constraints</p>
          <p><strong>Pass</strong> Component links</p>
          <p><strong>Pass</strong> Accessibility labels</p>
        </div>
      </aside>
    </section>
  );
}
