# Playground Visual Regression Testing

This directory is scaffolded for future visual regression testing using Playwright. 

## Intended Workflow

1. **Start the Playground App:**
   ```bash
   npm run dev --workspace=apps/playground
   ```

2. **Run Playwright Screenshots:**
   When Playwright tests are added in Sprint 4+, they will run against the playground instance to capture component screenshots:
   ```bash
   npx playwright test
   ```

3. **Comparison:**
   Playwright will compare the screenshots against reference baselines to flag any visual differences in components like Dividers, Badges, Buttons, etc.
