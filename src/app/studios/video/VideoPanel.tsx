import { useState } from "react";

const scenes = [
  { title: "Atmosphere open", duration: "00:06", shot: "85mm · slow push", cue: "Establish the intelligence field" },
  { title: "Product reveal", duration: "00:09", shot: "35mm · orbit", cue: "Reveal the creative operating system" },
  { title: "Human direction", duration: "00:07", shot: "50mm · locked", cue: "Close on governed creation" },
] as const;

export function VideoPanel() {
  const [selectedScene, setSelectedScene] = useState(0);
  const scene = scenes[selectedScene];

  return (
    <section
      className="studio-production-panel studio-production-panel--video"
      aria-label="Video production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner" aria-label="Video scenes and media">
        <div className="video-panel-heading"><span>Sequence</span><strong>Axiom launch / 00:22</strong></div>
        <button type="button" className="video-upload" aria-label="Upload media" disabled>+ Upload media</button>
        <small className="video-upload-note">Upload unavailable until persistence authority is approved.</small>
        <div className="video-scene-list" aria-label="Video scenes">
          {scenes.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Scene ${index + 1}: ${item.title}`}
              aria-pressed={selectedScene === index}
              onClick={() => setSelectedScene(index)}
            >
              <i aria-hidden="true" />
              <span><strong>{item.title}</strong><small>{item.shot}</small></span>
              <b>{item.duration}</b>
            </button>
          ))}
        </div>
        <div className="video-media-summary"><span>Linked media</span><strong>6 governed assets</strong><small>3 video · 2 audio · 1 title system</small></div>
      </aside>

      <section className="studio-panel-canvas video-canvas" aria-label="Video editorial canvas">
        <div className="video-canvas-bar"><span>Program monitor</span><strong>{scene.title} · {scene.duration}</strong></div>
        <article className={`video-monitor video-monitor--${selectedScene + 1}`}>
          <div className="video-monitor-orbit" aria-hidden="true"><i /><i /><i /></div>
          <div className="video-monitor-copy"><span>AXIOM STUDIO</span><h2>{scene.title}</h2><p>{scene.cue}</p></div>
          <div className="video-monitor-time">00:{selectedScene === 0 ? "02" : selectedScene === 1 ? "11" : "18"}:12</div>
        </article>
        <div className="video-transport" aria-label="Preview transport"><button type="button">◀</button><button type="button" aria-label="Play preview">▶</button><button type="button">▶|</button><span>24 fps · UHD preview</span></div>
        <div className="video-timeline" aria-label="Editorial timeline">
          <div><span>VIDEO</span><i className="video-clip video-clip--one" /><i className="video-clip video-clip--two" /><i className="video-clip video-clip--three" /></div>
          <div><span>TITLES</span><i className="video-clip video-clip--title" /></div>
          <div><span>AUDIO</span><i className="video-clip video-clip--audio" /></div>
          <b style={{ left: `${18 + selectedScene * 29}%` }} aria-hidden="true" />
        </div>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector" aria-label="Video continuity and delivery">
        <div className="video-panel-heading"><span>Shot inspector</span><strong>{scene.title}</strong></div>
        <dl className="video-properties">
          <div><dt>Camera</dt><dd>{scene.shot}</dd></div>
          <div><dt>Duration</dt><dd>{scene.duration}</dd></div>
          <div><dt>Color</dt><dd>Axiom nocturne</dd></div>
          <div><dt>Audio</dt><dd>-14 LUFS target</dd></div>
          <div><dt>Captions</dt><dd>Safe-area ready</dd></div>
        </dl>
        <div className="video-continuity"><span>Continuity</span><p><strong>Pass</strong> Direction and eye line</p><p><strong>Pass</strong> Color and light</p><p><strong>Pass</strong> Audio transition</p></div>
        <div className="video-delivery"><span>Delivery</span><strong>MP4 · MOV · WEBM · SRT</strong><small>Preview only · export authority required</small></div>
      </aside>
    </section>
  );
}
