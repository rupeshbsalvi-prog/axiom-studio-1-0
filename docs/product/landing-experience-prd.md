# Landing Experience PRD

[Back to docs index](../README.md)

## Objective

Design and build the public Axiom Landing Experience as an interactive cinematic entry into the Axiom ecosystem.

The landing experience must communicate:

- What Axiom Studio is.
- Why it is different from traditional AI tools.
- How Axiom Imagine X and Axiom Brain X work together.
- How users move from intent to professional output.
- Which studios, marketplace, pricing, and community capabilities exist.

## Product Philosophy

```text
User Intent First
    |
    v
AI Planning
    |
    v
Human Controlled AI
    |
    v
Professional Creation
```

The landing experience is not a static marketing website. It is the first chapter of the Axiom operating system.

## Target Platforms

The experience must support:

- Web: Chrome, Edge, Safari, Firefox.
- Desktop shell: Windows, macOS, Linux.
- Mobile: Android, iOS.
- Tablet: iPadOS and Android tablets.

Interactions must adapt to:

- Mouse.
- Keyboard.
- Touch.
- Stylus.
- Trackpad.
- Reduced-motion mode.

## Sections

## 1. Hero Experience

Required content:

- Full-viewport 3D or high-fidelity interactive scene.
- A stylized creator or brand-owner figure.
- Futuristic creative operating-system environment.
- Dynamic lighting.
- Ambient motion.
- Clear brand signal.

Headline:

`Create Without Limits`

Subheading:

`Powered by Axiom Imagine X`

Primary CTA:

`Start Creating`

Secondary CTA:

`Explore Axiom`

## 2. Scroll Transformation

As the user scrolls:

- Camera moves around the creator.
- Human imagination is visualized as neural energy.
- The energy expands into a network.
- The network resolves into Axiom Imagine X.

The sequence represents:

```text
Human Creativity -> Human Intent -> AI Planning -> Professional Creation
```

## 3. Axiom Philosophy

Animated principle cards:

- User Intent First.
- Human-Controlled AI.
- Professional Control.
- AI Planning.
- Universal Creativity.
- Non-Destructive Editing.
- Layer-Based Output.
- Privacy by Design.
- Performance First.
- Cross-Platform by Design.
- Offline First.
- Future Ready.

## 4. Axiom Brain X

Introduce the internal reasoning and orchestration subsystem.

Required topics:

- Reasoning.
- Memory.
- Knowledge graph.
- Workflow orchestration.
- Agent coordination.
- Context engine.
- Asset intelligence.
- Multi-model routing.
- Security.
- Privacy.

## 5. Axiom Imagine X

Introduce the user-facing creative intelligence model.

Required topics:

- Mission.
- AI planning.
- Prompt and intent conversion.
- Model routing.
- Connector ecosystem.
- MCP integration.
- Plugin framework.
- Marketplace integration.
- Auto Learner Mode.
- Provider-agnostic evolution.

## 6. Platform Ecosystem

Show Axiom as a complete creative operating system:

- Studios.
- Intelligence.
- Connectors.
- Marketplace.
- Community.
- Templates.
- Project Hub.
- Brand Assets.
- AI Agents.
- Workflows.

## 7. Studio Explorer

Interactive cards for every studio.

Each card must reveal:

- Studio name.
- Purpose.
- Capabilities.
- Supported AI models or provider types.
- File formats.
- Example outputs.
- Typical use cases.
- Performance expectations.

Clicking a card opens that studio's dedicated public page or authenticated studio route, depending on user state.

## 8. Project Hub Preview

Horizontal parallax or equivalent responsive browsing view:

- Featured projects.
- Templates.
- Community creations.
- Trending assets.
- Recently updated projects.
- Pinned examples.

## 9. Gallery

Professional showcase supporting:

- Images.
- Videos.
- Motion.
- Presentations.
- Vector.
- UI.
- 3D.
- Documents.
- Typography.
- Branding.
- Before and after states.

## 10. Pricing and Licensing

Pricing must appear after users understand the product value and before community conversion.

Link to [Subscription and Licensing](subscription-and-licensing.md).

## 11. Platform Compatibility

Display supported platforms:

- Web.
- Windows.
- macOS.
- Linux.
- Android.
- iOS.
- iPadOS.

Use synchronized device visuals where feasible.

## 12. Community

Required destinations:

- Discord.
- Documentation.
- Marketplace.
- GitHub.
- Careers.
- Partner Program.
- Contact.
- Newsletter.

## 13. Footer

Required links:

- Company.
- Privacy.
- Terms.
- Roadmap.
- Documentation.
- API.
- Support.
- Social links.
- Version information.

## Design System Requirements

- Dark premium base theme.
- Futuristic but readable.
- Color tokens.
- Typography scale.
- 8-point spacing system.
- Iconography rules.
- Elevation and glass standards.
- Component library alignment.
- Responsive typography without viewport-width font scaling.

## Animation Requirements

- Scroll-driven storytelling.
- Cinematic easing.
- No sudden movement.
- Keyboard and reduced-motion alternatives.
- Performance-aware fallbacks.

## 3D Requirements

- GLB and GLTF support.
- USDZ consideration for Apple AR or preview use cases.
- Level of detail for heavy scenes.
- Texture budgets.
- Compressed models.
- Fallback static or 2D scene for low-end devices.

## Performance Requirements

- Fast first paint.
- Lazy loading.
- Code splitting.
- GPU-accelerated animation.
- Asset streaming.
- Texture optimization.
- Responsive media.
- 60 FPS target where device capability allows.

## Accessibility Requirements

- WCAG AA target.
- Keyboard navigation.
- Screen reader support.
- Focus indicators.
- High contrast mode.
- Reduced motion mode.
- Clear CTA labels.

## Acceptance Criteria

- A first-time visitor understands the Axiom philosophy within the first two sections.
- The landing experience explains Axiom Imagine X and Axiom Brain X without confusing them.
- Studio Explorer links to all current studios.
- Pricing and free trial are visible before community conversion.
- Reduced-motion mode remains complete and usable.
- Mobile and tablet layouts preserve the core story.

## Baseline Update

This document implements [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md).

## Locked Baseline

Changes require an ADR.
