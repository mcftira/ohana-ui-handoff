# UI handoff boundaries

Work only on the Ohana presentation layer in this repository.

- Read README.md before editing.
- Use the provided local preview and synthetic data. No credentials are needed.
- Never request production access or connect this preview to live services.
- No backend, authentication, permission, reservation, payment, email, DNS,
  infrastructure, database, or deployment changes belong in this repository.
- Preserve selectors and DOM attributes used by the existing UI controllers.
- Preserve prices, slot times, capacity rules, consent behavior and approved
  policy copy. Submit proposed business-copy changes separately.
- Prefer scoped CSS and accessible semantic markup over additional dependencies.
- Keep desktop and mobile layouts usable, including keyboard/focus behavior,
  loading, disabled, empty, error and success states.
- CRM and staff fixtures use synthetic data and approximate native markup.
  Do not claim that fixture-only tests prove native application compatibility.
- Keep preview safety guards and labels in place.
- Keep third-party license and attribution files with their assets.
- Return changes as a pull request or patch with screenshots and validation notes.
- Do not deploy. A maintainer reviews and integrates UI changes in the private app.
