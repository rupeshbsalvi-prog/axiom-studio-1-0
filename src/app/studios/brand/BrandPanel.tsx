import { useState } from "react";

const applications = ["Core identity", "Product surface", "Campaign system"] as const;
const palette = [
  ["Electric Cyan", "#00D9FF"],
  ["Deep Violet", "#6A00FF"],
  ["Neon Magenta", "#FF007A"],
  ["Cyber Orange", "#FF7A00"],
] as const;

export function BrandPanel() {
  const [promise, setPromise] = useState("Create without limits");
  const [application, setApplication] = useState(0);

  return (
    <section
      className="studio-production-panel studio-production-panel--brand"
      aria-label="Brand production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner" aria-label="Brand kit and assets">
        <div className="brand-panel-heading">
          <span>Living brand kit</span>
          <strong>Axiom Studio / R1</strong>
        </div>
        <label className="brand-field">
          Brand promise
          <textarea aria-label="Brand promise" value={promise} onChange={(event) => setPromise(event.target.value)} rows={4} />
        </label>
        <div className="brand-application-list" aria-label="Identity applications">
          {applications.map((item, index) => (
            <button
              key={item}
              type="button"
              aria-label={`Application ${index + 1}: ${item}`}
              aria-pressed={application === index}
              onClick={() => setApplication(index)}
            >
              <span>0{index + 1}</span>
              <strong>{item}</strong>
            </button>
          ))}
        </div>
        <div className="brand-asset-summary">
          <span>Approved assets</span>
          <strong>Logo R1 · 3 masters</strong>
          <small>Raster display, UI mark, hero artwork</small>
        </div>
      </aside>

      <section className="studio-panel-canvas brand-canvas" aria-label="Brand identity canvas">
        <div className="brand-canvas-bar">
          <span>{applications[application]}</span>
          <strong>Governed · Approved</strong>
        </div>
        <article className="brand-identity-stage">
          <div className="brand-monogram" aria-hidden="true">A</div>
          <div className="brand-wordmark">
            <p>AI-native creative operating system</p>
            <h2>Axiom Studio</h2>
            <strong>{promise || "Create without limits"}</strong>
          </div>
          <div className="brand-application-label">{applications[application]}</div>
        </article>
        <div className="brand-palette" aria-label="Primary color palette">
          {palette.map(([name, color]) => (
            <div key={name}>
              <i style={{ background: color }} />
              <span>{name}</span>
              <code>{color}</code>
            </div>
          ))}
        </div>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector" aria-label="Brand governance and tokens">
        <div className="brand-panel-heading">
          <span>Governance</span>
          <strong>Brand system healthy</strong>
        </div>
        <dl className="brand-properties">
          <div><dt>Logo clear space</dt><dd>1× mark</dd></div>
          <div><dt>Minimum UI size</dt><dd>32 px</dd></div>
          <div><dt>Display type</dt><dd>Sora 700</dd></div>
          <div><dt>Interface type</dt><dd>Inter 400</dd></div>
        </dl>
        <div className="brand-compliance">
          <span>Compliance checks</span>
          <p><strong>Pass</strong> Contrast and legibility</p>
          <p><strong>Pass</strong> Approved gradient use</p>
          <p><strong>Pass</strong> Clear-space boundary</p>
        </div>
        <div className="brand-token-preview">
          <span>Token preview</span>
          <code>--brand-gradient: 135deg, #00D9FF, #6A00FF, #FF007A, #FF7A00;</code>
        </div>
      </aside>
    </section>
  );
}
