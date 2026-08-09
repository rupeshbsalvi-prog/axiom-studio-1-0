import { useState } from "react";

const slides = [
  {
    label: "Opening",
    title: "Create without limits",
    body: "One intelligent creative operating system for every discipline.",
    metric: "01",
  },
  {
    label: "The opportunity",
    title: "The creative stack is fragmented",
    body: "Axiom unifies direction, production, governance, and editable output.",
    metric: "02",
  },
  {
    label: "The system",
    title: "From intent to professional creation",
    body: "Imagine X plans. Specialized Studios craft. Human approval stays visible.",
    metric: "03",
  },
] as const;

export function PresentationPanel() {
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [notes, setNotes] = useState("Open with the platform promise, then establish the creative-system problem.");
  const slide = slides[selectedSlide];

  return (
    <section
      className="studio-production-panel studio-production-panel--presentation"
      aria-label="Presentation production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner" aria-label="Presentation planner and slides">
        <div className="presentation-panel-heading">
          <span>Deck structure</span>
          <strong>Axiom Vision / 03</strong>
        </div>
        <button className="presentation-add-slide" type="button">+ Add slide</button>
        <div className="presentation-slide-list">
          {slides.map((item, index) => (
            <button
              key={item.metric}
              type="button"
              aria-label={`Slide ${index + 1}: ${item.label}`}
              aria-pressed={selectedSlide === index}
              onClick={() => setSelectedSlide(index)}
            >
              <span>{item.metric}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.title}</small>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="studio-panel-canvas presentation-canvas" aria-label="Presentation slide canvas">
        <div className="presentation-canvas-bar">
          <span>Slide {selectedSlide + 1} / {slides.length}</span>
          <strong>16:9 · 1920 × 1080</strong>
        </div>
        <article className="presentation-slide">
          <div className="presentation-slide-brand">Axiom Studio</div>
          <div className="presentation-slide-copy">
            <p>{slide.label}</p>
            <h2>{slide.title}</h2>
            <div />
            <p>{slide.body}</p>
          </div>
          <strong className="presentation-slide-number">{slide.metric}</strong>
        </article>
        <div className="presentation-filmstrip" aria-label="Slide filmstrip">
          {slides.map((item, index) => (
            <button key={item.metric} type="button" aria-label={`Preview slide ${index + 1}`} onClick={() => setSelectedSlide(index)}>
              <span>{item.metric}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector" aria-label="Presentation properties and notes">
        <div className="presentation-panel-heading">
          <span>Slide properties</span>
          <strong>{slide.label}</strong>
        </div>
        <label className="presentation-field">
          Layout
          <select defaultValue="statement">
            <option value="statement">Statement</option>
            <option value="split">Split story</option>
            <option value="metric">Metric focus</option>
          </select>
        </label>
        <label className="presentation-field">
          Theme
          <select defaultValue="axiom-dark">
            <option value="axiom-dark">Axiom Dark</option>
            <option value="editorial-light">Editorial Light</option>
          </select>
        </label>
        <div className="presentation-safe-area">
          <span>Safe area</span>
          <strong>96 px</strong>
          <p>All content remains inside presentation and broadcast-safe margins.</p>
        </div>
        <label className="presentation-field presentation-notes">
          Speaker notes
          <textarea aria-label="Speaker notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} />
        </label>
      </aside>
    </section>
  );
}
