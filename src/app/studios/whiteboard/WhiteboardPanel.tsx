import { useState } from "react";

const boards = [
  { title: "Launch workshop", goal: "Align the launch story and owners", nodes: ["Audience truth", "Creative promise", "Launch moments", "Owners"] },
  { title: "Product map", goal: "Connect user intent to product value", nodes: ["User intent", "Imagine X plan", "Studio workflow", "Governed output"] },
  { title: "Research synthesis", goal: "Turn evidence into clear opportunities", nodes: ["Signals", "Themes", "Insights", "Opportunities"] },
] as const;
const views = ["Canvas", "Flow"] as const;

export function WhiteboardPanel() {
  const [selectedBoard, setSelectedBoard] = useState(0);
  const [selectedView, setSelectedView] = useState(0);
  const board = boards[selectedBoard];

  return (
    <section
      className="studio-production-panel studio-production-panel--whiteboard"
      aria-label="Whiteboard production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner" aria-label="Boards and facilitation tools">
        <div className="whiteboard-heading"><span>Workspace boards</span><strong>Strategy room / 03</strong></div>
        <button className="whiteboard-invite" type="button" aria-label="Invite collaborators" disabled>+ Invite collaborators</button>
        <small className="whiteboard-authority-note">Live collaboration requires authenticated workspace authority.</small>
        <div className="whiteboard-board-list" aria-label="Local boards">
          {boards.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Board ${index + 1}: ${item.title}`}
              aria-pressed={selectedBoard === index}
              onClick={() => setSelectedBoard(index)}
            >
              <span>0{index + 1}</span>
              <div><strong>{item.title}</strong><small>{item.goal}</small></div>
            </button>
          ))}
        </div>
        <div className="whiteboard-tool-summary"><span>Facilitation kit</span><strong>Notes · cards · connectors</strong><small>Local preview tools only</small></div>
      </aside>

      <section className="studio-panel-canvas whiteboard-canvas" aria-label="Whiteboard canvas">
        <div className="whiteboard-canvas-bar"><div><span>Active board</span><strong>{board.title}</strong></div><small>Saved locally</small></div>
        <div className="whiteboard-view-controls" aria-label="Board views">
          {views.map((view, index) => (
            <button key={view} type="button" aria-label={`${view} view`} aria-pressed={selectedView === index} onClick={() => setSelectedView(index)}>{view}</button>
          ))}
        </div>
        <article className={`whiteboard-stage whiteboard-stage--${views[selectedView].toLowerCase()}`}>
          <header><span>Workshop objective</span><strong>{board.goal}</strong></header>
          <div className="whiteboard-node-map">
            {board.nodes.map((node, index) => <div className={`whiteboard-node whiteboard-node--${index + 1}`} key={node}><span>0{index + 1}</span><strong>{node}</strong><small>{index + 1 < board.nodes.length ? "Connected" : "Outcome"}</small></div>)}
          </div>
          <footer><span>{views[selectedView]} view</span><strong>4 nodes · 3 relationships</strong></footer>
        </article>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector" aria-label="Board structure and collaboration">
        <div className="whiteboard-heading"><span>Board inspector</span><strong>{board.title}</strong></div>
        <dl className="whiteboard-properties">
          <div><dt>Objective</dt><dd>{board.goal}</dd></div>
          <div><dt>Structure</dt><dd>Directed flow</dd></div>
          <div><dt>Nodes</dt><dd>4 local</dd></div>
          <div><dt>Connectors</dt><dd>3 semantic</dd></div>
        </dl>
        <div className="whiteboard-readiness"><span>Facilitation readiness</span><p><strong>Ready</strong> Objective is visible</p><p><strong>Ready</strong> Outcomes are grouped</p><p><strong>Ready</strong> Reading order is clear</p></div>
        <div className="whiteboard-collaboration"><span>Collaboration</span><strong>Local workspace only</strong><small>Presence, invites, and sync remain blocked</small></div>
      </aside>
    </section>
  );
}
