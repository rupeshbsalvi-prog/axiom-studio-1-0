import { useState } from "react";

const collections = ["Campaign Library", "Brand Masters", "Product UI"] as const;
const assets = [
  { name: "Launch key art", kind: "Image · WEBP", source: "Imagine X approved generation", size: "3840 × 2160", tone: "cyan" },
  { name: "Campaign portrait", kind: "Image · TIFF", source: "Camera original + governed grade", size: "7952 × 5304", tone: "violet" },
  { name: "Motion ident", kind: "Motion · WEBM", source: "Motion Studio composition", size: "00:08 · 4K", tone: "orange" },
  { name: "Axiom monogram", kind: "Vector · SVG", source: "Brand Studio master R1", size: "Responsive SVG", tone: "magenta" },
  { name: "Product dashboard", kind: "Frame · JSON", source: "UI/UX Studio handoff", size: "1440 × 1024", tone: "blue" },
  { name: "Type specimen", kind: "Document · PDF", source: "Typography Studio export", size: "12 pages", tone: "amber" },
] as const;

export function AssetHubPanel() {
  const [collection, setCollection] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(0);
  const asset = assets[selectedAsset];

  return (
    <section
      className="studio-production-panel studio-production-panel--asset-hub"
      aria-label="Asset Hub production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner" aria-label="Asset collections and filters">
        <div className="asset-hub-heading">
          <span>Asset library</span>
          <strong>128 governed items</strong>
        </div>
        <div className="asset-hub-collections" aria-label="Asset collections">
          {collections.map((item, index) => (
            <button
              key={item}
              type="button"
              aria-label={`Collection ${index + 1}: ${item}`}
              aria-pressed={collection === index}
              onClick={() => setCollection(index)}
            >
              <span>0{index + 1}</span>
              <strong>{item}</strong>
              <small>{[42, 18, 68][index]} assets</small>
            </button>
          ))}
        </div>
        <div className="asset-hub-filter-summary">
          <span>Active scope</span>
          <strong>Approved · All formats</strong>
          <small>Private workspace · provenance required</small>
        </div>
      </aside>

      <section className="studio-panel-canvas asset-hub-canvas" aria-label="Asset library canvas">
        <div className="asset-hub-toolbar">
          <div><span>Collection</span><strong>{collections[collection]}</strong></div>
          <span>{assets.length} visible</span>
        </div>
        <div className="asset-hub-grid">
          {assets.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-label={`Asset: ${item.name}`}
              aria-pressed={selectedAsset === index}
              onClick={() => setSelectedAsset(index)}
            >
              <i className={`asset-hub-preview asset-hub-preview--${item.tone}`} aria-hidden="true"><b /></i>
              <span><strong>{item.name}</strong><small>{item.kind}</small></span>
            </button>
          ))}
        </div>
        <div className="asset-hub-status"><strong>Library synchronized</strong><span>6 selected-ready assets · 0 unresolved sources</span></div>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector" aria-label="Asset provenance and delivery">
        <div className="asset-hub-heading">
          <span>Asset inspector</span>
          <strong>{asset.name}</strong>
        </div>
        <div className={`asset-hub-inspector-preview asset-hub-preview--${asset.tone}`} aria-hidden="true"><b /></div>
        <dl className="asset-hub-properties">
          <div><dt>Type</dt><dd>{asset.kind}</dd></div>
          <div><dt>Dimensions</dt><dd>{asset.size}</dd></div>
          <div><dt>Source</dt><dd>{asset.source}</dd></div>
          <div><dt>Rights</dt><dd>Workspace approved</dd></div>
        </dl>
        <div className="asset-hub-provenance">
          <span>Provenance chain</span>
          <p><strong>Verified</strong> Source and author recorded</p>
          <p><strong>Verified</strong> Usage policy attached</p>
          <p><strong>Ready</strong> Insert into Studio</p>
        </div>
      </aside>
    </section>
  );
}
