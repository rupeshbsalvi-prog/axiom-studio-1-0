import React from "react";

export interface ComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
}

export interface ComponentMetadata {
  name: string;
  package: string;
  since: string;
  maturity: "L1" | "L2" | "L3" | "L4";
  accessibility: "A" | "AA" | "AAA";
  category: "inputs" | "outputs" | "layout" | "feedback" | "navigation" | "utilities" | "infrastructure";
  tokens: string[];
  dependencies: string[];
  status: "stable" | "experimental" | "deprecated";
}

