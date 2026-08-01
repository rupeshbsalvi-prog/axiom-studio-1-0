import type { PhotoLayer, PhotoTemplate, PhotoPlanResponse, PhotoCanvasState, PhotoAuditEvent } from "../../services/photoTypes";
import type { AxiomProjectDraft } from "../../projects/projectDraft";

export interface PhotoAdjustmentHistoryEntry {
  timestamp: string;
  layerId: string;
  description: string;
}

export interface PhotoStudioState {
  projectId: string;
  activePlan: PhotoPlanResponse | null;
  selectedLayerId: string | null;
  canvas: PhotoCanvasState;
  layers: PhotoLayer[];
  layerOrder: string[];
  templates: PhotoTemplate | null;
  adjustmentHistory: PhotoAdjustmentHistoryEntry[];
  audit: PhotoAuditEvent[];
}

export const PHOTO_INITIAL_STATE: PhotoStudioState = {
  projectId: "",
  activePlan: null,
  selectedLayerId: null,
  canvas: {
    width: 800,
    height: 800,
    aspectRatio: "1:1",
    background: "#090d16"
  },
  layers: [],
  layerOrder: [],
  templates: null,
  adjustmentHistory: [],
  audit: []
};

export function hydratePhotoStateFromProject(
  current: PhotoStudioState,
  project?: AxiomProjectDraft | null
): PhotoStudioState {
  if (current.layers.length > 0 || !project?.canvas.photo?.elements.length) {
    return current;
  }

  const layers = project.canvas.photo.elements.flatMap((value, index): PhotoLayer[] => {
    if (!value || typeof value !== "object" || !("bounds" in value)) {
      return [];
    }
    const element = value as Record<string, any>;
    const bounds = element.bounds;
    if (
      !bounds ||
      !["x", "y", "width", "height"].every((key) => typeof bounds[key] === "number")
    ) {
      return [];
    }

    const allowedTypes: PhotoLayer["type"][] = ["image", "gradient", "shape", "text", "texture", "placeholder"];
    return [{
      id: typeof element.id === "string" ? element.id : `photo-layer-${index + 1}`,
      name: typeof element.label === "string" ? element.label : `Photo layer ${index + 1}`,
      type: allowedTypes.includes(element.type) ? element.type : "image",
      visible: true,
      opacity: typeof element.opacity === "number" ? Math.min(1, Math.max(0, element.opacity)) : 1,
      blendMode: typeof element.blendMode === "string" ? element.blendMode : "normal",
      position: { ...bounds, rotation: 0 },
      source: typeof element.source === "string" ? element.source : undefined,
      adjustments: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        hueRotate: 0,
        grayscale: 0,
      },
    }];
  });

  if (layers.length === 0) {
    return current;
  }

  const applied = [...(project.canvasPreview?.applications ?? [])]
    .reverse()
    .find((item) => item.studioId === "photo" && item.status === "applied");
  const projection = project.canvasPreview?.projections.find((item) => item.id === applied?.projectionId);

  return {
    ...current,
    projectId: project.manifest.id,
    canvas: projection
      ? {
          width: projection.canvas.width,
          height: projection.canvas.height,
          aspectRatio: projection.canvas.aspectRatio,
          background: projection.canvas.background === "transparent" ? "transparent" : current.canvas.background,
        }
      : current.canvas,
    layers,
    layerOrder: layers.map((layer) => layer.id),
    selectedLayerId: layers[0].id,
  };
}

export function persistPhotoStateToProject(
  project: AxiomProjectDraft,
  state: PhotoStudioState
): AxiomProjectDraft {
  const existingElements = project.canvas.photo?.elements ?? [];
  const existingById = new Map(
    existingElements
      .filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object")
      .map((value) => [typeof value.id === "string" ? value.id : "", value])
  );
  const layersById = new Map(state.layers.map((layer) => [layer.id, layer]));
  const orderedLayers = state.layerOrder
    .map((id) => layersById.get(id))
    .filter((layer): layer is PhotoLayer => Boolean(layer));
  const now = new Date().toISOString();

  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: now },
    canvas: {
      ...project.canvas,
      photo: {
        ...(project.canvas.photo ?? { viewport: { zoom: 1, panX: 0, panY: 0 } }),
        elements: orderedLayers.map((layer) => ({
          ...existingById.get(layer.id),
          id: layer.id,
          label: layer.name,
          type: layer.type,
          bounds: {
            x: layer.position.x,
            y: layer.position.y,
            width: layer.position.width,
            height: layer.position.height,
          },
          rotation: layer.position.rotation,
          opacity: layer.opacity,
          blendMode: layer.blendMode,
          source: layer.source,
          visible: layer.visible,
          adjustments: { ...layer.adjustments },
        })),
      },
    },
  };
}
