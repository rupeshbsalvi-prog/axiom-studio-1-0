import type { CSSProperties } from 'react';
import './BrandRoadmapPanel.css';

const workstreams = [{"id": "B01", "name": "Brand Governance & Control", "objective": "Establish ownership, decision rights, versioning, approvals and brand-change controls.", "gate": "G0 - Authority locked", "color": "#7357FF"},{"id": "B02", "name": "Research & Brand Intelligence", "objective": "Ground the brand in audience evidence, category dynamics and real usage contexts.", "gate": "G1 - Evidence accepted", "color": "#2E8BFF"},{"id": "B03", "name": "Strategic Foundation", "objective": "Define the durable strategic core that constrains all downstream expression.", "gate": "G2 - North Star approved", "color": "#FFB34D"},{"id": "B04", "name": "Audience & Ecosystem", "objective": "Define priority audiences, decision roles, jobs-to-be-done and trust barriers.", "gate": "G3 - Audience priority locked", "color": "#36D6E7"},{"id": "B05", "name": "Category, Positioning & Differentiation", "objective": "Claim a defensible mental position and articulate why Axiom is meaningfully different.", "gate": "G4 - Positioning approved", "color": "#2FD69B"},{"id": "B06", "name": "Brand Architecture & Naming", "objective": "Create a scalable naming and relationship model for Axiom Studio, modules, engines, workflows and editions.", "gate": "G5 - Naming system locked", "color": "#F55DAA"},{"id": "B07", "name": "Brand Story & Narrative", "objective": "Translate strategy into a memorable narrative that connects product truth to human ambition.", "gate": "G6 - Narrative approved", "color": "#F55DAA"},{"id": "B08", "name": "Verbal Identity & Messaging", "objective": "Standardize how Axiom speaks across product, marketing, sales, support and governance.", "gate": "G7 - Language system approved", "color": "#7357FF"},{"id": "B09", "name": "Visual Identity System", "objective": "Create a distinctive, accessible and production-ready visual language.", "gate": "G8 - Visual system approved", "color": "#2E8BFF"},{"id": "B10", "name": "Motion, Sound & Spatial Expression", "objective": "Define how Axiom moves, sounds and occupies space without becoming decorative or inaccessible.", "gate": "G9 - Dynamic expression approved", "color": "#36D6E7"},{"id": "B11", "name": "Product & Service Experience", "objective": "Make the product behaviour itself prove the brand promise.", "gate": "G10 - Experience contract approved", "color": "#2FD69B"},{"id": "B12", "name": "Digital Presence & Channel System", "objective": "Define the role, content and conversion logic of every owned digital channel.", "gate": "G11 - Channel architecture approved", "color": "#7357FF"},{"id": "B13", "name": "Content & Editorial Engine", "objective": "Build a repeatable system that creates authority, education, demand and community value.", "gate": "G12 - Editorial engine operational", "color": "#FFB34D"},{"id": "B14", "name": "Marketing, Growth & Demand", "objective": "Translate the brand into measurable acquisition, activation, conversion and retention programmes.", "gate": "G13 - Growth system approved", "color": "#2E8BFF"},{"id": "B15", "name": "Community, Partnerships, PR & Advocacy", "objective": "Earn trust through relationships, credible voices and participatory ecosystems.", "gate": "G14 - Advocacy system approved", "color": "#F55DAA"},{"id": "B16", "name": "Collateral, Sales Enablement & Environment", "objective": "Standardize every physical and commercial touchpoint from decks to events.", "gate": "G15 - Collateral library live", "color": "#FFB34D"},{"id": "B17", "name": "Trust, Legal, Accessibility & Ethics", "objective": "Protect the brand by making claims, rights, accessibility and AI use governable.", "gate": "G16 - Trust review passed", "color": "#D95763"},{"id": "B18", "name": "Brand Operations, Assets & Enablement", "objective": "Turn guidelines into an operational system that teams can actually use.", "gate": "G17 - Operating model live", "color": "#36D6E7"},{"id": "B19", "name": "Measurement, Learning & Evolution", "objective": "Measure brand strength and continuously improve without chasing superficial trends.", "gate": "G18 - Measurement baseline live", "color": "#2FD69B"}] as const;

export function BrandRoadmapPanel() {
  return (
    <section className="brand-roadmap-panel" aria-labelledby="brand-roadmap-title">
      <header className="brand-roadmap-panel__header">
        <p className="brand-roadmap-panel__eyebrow">Axiom Studio brand system</p>
        <h1 id="brand-roadmap-title">Ultimate Branding Roadmap</h1>
        <p>From authority and evidence to expression, activation, operations and measurable evolution.</p>
      </header>
      <div className="brand-roadmap-panel__grid">
        {workstreams.map((item) => (
          <article className="brand-roadmap-panel__card" key={item.id} style={{ '--brand-accent': item.color } as CSSProperties}>
            <span className="brand-roadmap-panel__id">{item.id}</span>
            <h2>{item.name}</h2>
            <p>{item.objective}</p>
            <span className="brand-roadmap-panel__gate">{item.gate}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
