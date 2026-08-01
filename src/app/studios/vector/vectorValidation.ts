import type { VectorShape } from "../../services/vectorTypes";

export function validateHexColor(color: string): boolean {
  return /^#[a-fA-F0-9]{6}$/.test(color);
}

export function validateOpacity(opacity: number): boolean {
  return opacity >= 0 && opacity <= 1 && !isNaN(opacity) && isFinite(opacity);
}

export function validateStrokeWidth(width: number): boolean {
  return width >= 0 && !isNaN(width) && isFinite(width);
}

export function validatePositiveNumber(val: number): boolean {
  return val > 0 && !isNaN(val) && isFinite(val);
}

export function validateCoordinates(val: number): boolean {
  return !isNaN(val) && isFinite(val);
}

export function validateTextLength(text: string): boolean {
  return text.length <= 200;
}

export function validatePathData(d: string): boolean {
  // SVG path commands only contain letters, numbers, spaces, commas, dots, and minuses
  return /^[MmLlHhVvCcSsQqTtAaZz0-9\s,\-\.]+$/.test(d);
}

export function validateShape(shape: VectorShape): { valid: boolean; error?: string } {
  if (!validateHexColor(shape.fill) && shape.fill !== "none") {
    return { valid: false, error: "Invalid fill color format. Use #RRGGBB." };
  }
  if (!validateHexColor(shape.stroke) && shape.stroke !== "none") {
    return { valid: false, error: "Invalid stroke color format. Use #RRGGBB." };
  }
  if (!validateOpacity(shape.opacity)) {
    return { valid: false, error: "Opacity must be between 0.0 and 1.0." };
  }
  if (!validateStrokeWidth(shape.strokeWidth)) {
    return { valid: false, error: "Stroke width must be greater than or equal to 0." };
  }

  if (shape.type === "rect") {
    if (!validatePositiveNumber(shape.width) || !validatePositiveNumber(shape.height)) {
      return { valid: false, error: "Rectangle width and height must be greater than 0." };
    }
    if (!validateCoordinates(shape.x) || !validateCoordinates(shape.y)) {
      return { valid: false, error: "Rectangle coordinates must be valid numbers." };
    }
  } else if (shape.type === "circle") {
    if (!validatePositiveNumber(shape.r)) {
      return { valid: false, error: "Circle radius r must be greater than 0." };
    }
    if (!validateCoordinates(shape.cx) || !validateCoordinates(shape.cy)) {
      return { valid: false, error: "Circle coordinates must be valid numbers." };
    }
  } else if (shape.type === "text") {
    if (!validateTextLength(shape.text)) {
      return { valid: false, error: "Text content exceeds 200 characters limit." };
    }
    if (!validateCoordinates(shape.x) || !validateCoordinates(shape.y)) {
      return { valid: false, error: "Text coordinates must be valid numbers." };
    }
    if (!validatePositiveNumber(shape.fontSize)) {
      return { valid: false, error: "Text font size must be greater than 0." };
    }
  } else if (shape.type === "path") {
    if (!validatePathData(shape.d)) {
      return { valid: false, error: "SVG path contains invalid or unsafe characters." };
    }
  }

  return { valid: true };
}
