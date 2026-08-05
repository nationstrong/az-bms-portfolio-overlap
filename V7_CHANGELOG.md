# V7 fix

- Packages the commercial chart HTML, JavaScript, data, and CSS together to prevent mixed-version deployments.
- Adds cache-busting query strings (`?v=7`).
- Adds explicit SVG sizing so the combined sales chart remains visible even if older CSS is cached.
- Adds a visible loading/error message instead of leaving a blank section when a required asset is stale or missing.
