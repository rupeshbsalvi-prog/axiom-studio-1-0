import type { VectorShape } from "../../services/vectorTypes";
import type { VectorStudioState } from "./VectorState";

export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}

export function serializeVectorStateToSvg(state: VectorStudioState): string {
  const { width, height, viewBox, background } = state.canvas;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">\n`;
  
  // Renders the background shape safely
  svgContent += `  <rect width="${width}" height="${height}" fill="${escapeXml(background)}" />\n`;

  // Draw layers in shapeOrder from bottom to top
  state.shapeOrder.forEach((id) => {
    const shape = state.shapes[id];
    if (!shape || !shape.visible) return;

    const fill = escapeXml(shape.fill);
    const stroke = escapeXml(shape.stroke);
    const strokeWidth = shape.strokeWidth;
    const opacity = shape.opacity;

    // Build transform string if active
    let transformStr = "";
    if (shape.transform && (shape.transform.x !== 0 || shape.transform.y !== 0 || shape.transform.rotation !== 0 || shape.transform.scaleX !== 1 || shape.transform.scaleY !== 1)) {
      const parts: string[] = [];
      if (shape.transform.x !== 0 || shape.transform.y !== 0) {
        parts.push(`translate(${shape.transform.x} ${shape.transform.y})`);
      }
      if (shape.transform.rotation !== 0) {
        parts.push(`rotate(${shape.transform.rotation})`);
      }
      if (shape.transform.scaleX !== 1 || shape.transform.scaleY !== 1) {
        parts.push(`scale(${shape.transform.scaleX} ${shape.transform.scaleY})`);
      }
      transformStr = ` transform="${parts.join(' ')}"`;
    }

    const baseAttrs = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"${transformStr}`;

    if (shape.type === "rect") {
      const rxAttr = shape.rx ? ` rx="${shape.rx}"` : "";
      svgContent += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}"${rxAttr} ${baseAttrs} />\n`;
    } else if (shape.type === "circle") {
      svgContent += `  <circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" ${baseAttrs} />\n`;
    } else if (shape.type === "text") {
      const family = shape.fontFamily ? ` font-family="${escapeXml(shape.fontFamily)}"` : "";
      svgContent += `  <text x="${shape.x}" y="${shape.y}" font-size="${shape.fontSize}"${family} ${baseAttrs}>${escapeXml(shape.text)}</text>\n`;
    } else if (shape.type === "path") {
      svgContent += `  <path d="${escapeXml(shape.d)}" ${baseAttrs} />\n`;
    }
  });

  svgContent += "</svg>";
  return svgContent;
}
