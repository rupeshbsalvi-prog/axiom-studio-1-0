import { useState } from "react";

const scale = [
  ["Display", "64 / 68", "700"],
  ["Heading", "36 / 42", "650"],
  ["Body", "18 / 30", "400"],
] as const;

export function TypographyPanel() {
  const [specimen, setSpecimen] = useState("Intelligence made visible");

  return (
    <section
      className="studio-production-panel studio-production-panel--typography"
      aria-label="Typography production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner" aria-label="Typography planner and styles">
        <div className="typography-panel-heading">
          <span>Type direction</span>
          <strong>Editorial Intelligence</strong>
        </div>

        <label className="typography-field">
          Specimen text
          <textarea value={specimen} onChange={(event) => setSpecimen(event.target.value)} rows={4} />
        </label>

        <label className="typography-field">
          Display face
          <select defaultValue="sora">
            <option value="sora">Sora</option>
            <option value="space-grotesk">Space Grotesk</option>
            <option value="inter">Inter</option>
          </select>
        </label>

        <label className="typography-field">
          Text face
          <select defaultValue="inter">
            <option value="inter">Inter</option>
            <option value="space-grotesk">Space Grotesk</option>
          </select>
        </label>

        <div className="typography-style-list" aria-label="Type styles">
          {scale.map(([name, size]) => (
            <button key={name} type="button">
              <span>{name}</span>
              <strong>{size}</strong>
            </button>
          ))}
        </div>
      </aside>

      <section className="studio-panel-canvas typography-canvas" aria-label="Typography specimen canvas">
        <div className="typography-canvas-bar">
          <span>Live specimen</span>
          <strong>AA · 7.8:1</strong>
        </div>
        <article className="typography-specimen">
          <p>Axiom Studio · Type System 01</p>
          <h2>{specimen || "Type something extraordinary"}</h2>
          <div />
          <p>
            A disciplined type system turns creative direction into a clear, repeatable visual voice across every Studio.
          </p>
        </article>
        <div className="typography-ramp" aria-label="Type scale preview">
          {scale.map(([name, size, weight]) => (
            <div key={name}>
              <span>{name}</span>
              <strong style={{ fontSize: `${Math.max(16, Number(size.split(" ")[0]) / 2)}px`, fontWeight: Number(weight) }}>
                Ag
              </strong>
              <small>{size} · {weight}</small>
            </div>
          ))}
        </div>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector" aria-label="Typography properties and audit">
        <div className="typography-panel-heading">
          <span>Properties</span>
          <strong>Display / Sora</strong>
        </div>
        <dl className="typography-properties">
          <div><dt>Size</dt><dd>64 px</dd></div>
          <div><dt>Line height</dt><dd>68 px</dd></div>
          <div><dt>Weight</dt><dd>700</dd></div>
          <div><dt>Tracking</dt><dd>−3%</dd></div>
        </dl>
        <div className="typography-readability">
          <span>Readability</span>
          <strong>Excellent</strong>
          <p>Contrast, measure, and rhythm pass the current editorial profile.</p>
        </div>
        <div className="typography-token-preview">
          <span>Token preview</span>
          <code>--type-display: 700 4rem/1.06 Sora;</code>
        </div>
      </aside>
    </section>
  );
}
