import React from "react";
import { describe, bench } from "vitest";
import { render } from "@testing-library/react";
import { Surface, Text, Stack, Grid } from "../src/index";

describe("Layout Primitives Performance Benchmarks", () => {
  bench("Surface × 1000", () => {
    const items = Array.from({ length: 1000 }, (_, i) => (
      <Surface key={i}>Surface {i}</Surface>
    ));
    const container = document.createElement("div");
    render(<>{items}</>, { container });
  });

  bench("Text × 1000", () => {
    const items = Array.from({ length: 1000 }, (_, i) => (
      <Text key={i}>Text {i}</Text>
    ));
    const container = document.createElement("div");
    render(<>{items}</>, { container });
  });

  bench("Stack × 1000", () => {
    const items = Array.from({ length: 1000 }, (_, i) => (
      <Stack key={i}>Stack {i}</Stack>
    ));
    const container = document.createElement("div");
    render(<>{items}</>, { container });
  });

  bench("Grid × 1000", () => {
    const items = Array.from({ length: 1000 }, (_, i) => (
      <Grid key={i}>Grid {i}</Grid>
    ));
    const container = document.createElement("div");
    render(<>{items}</>, { container });
  });
});
