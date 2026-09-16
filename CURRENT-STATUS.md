# Website current status

State: initial cut ready for owner review; part of DevCapsule's `website` workstream.
Branch: `initial-cut`. Delivery: owner review, then pull request to `main`.
Independent future development: `single-stream`; transition not yet performed.

## Current result

Eleventy renders the parent README, guides and development blog. The custom
responsive presentation, navigation, code highlighting/copying, local preview,
source-link conversion and build identities are implemented. Content stays in
DevCapsule. No website, cloud infrastructure, or production DNS has been published.

The parent owns the current experiment budget and interruption arrangements.
SSH clone/push is the delivery path; GitHub app access is unavailable. The owner
accepts local execution of build/trigger scripts and will handle backend wiring
at delivery. See [PUBLISHING.md](PUBLISHING.md).

## Validation

Build and all 582 local links/anchors/assets pass across 16 HTML pages. Four
focused routing/rendering tests pass. Chromium audits of six representative
pages at 1440px and 390px pass with zero automated WCAG A/AA violations, no page
overflow, and no JavaScript errors. Keyboard skip/anchor navigation and no-JS
navigation pass. Additional 320px reflow and exact clipboard checks pass.
Desktop and mobile screenshots were visually inspected. Evidence is in ignored
`.artifacts/` for this checkout; regenerate it with the browser-check script.

The clean standalone clone acceptance passed: npm ci/build, paragraph update,
independent styling update with unchanged content digest, subdirectory links,
and production canonical/robots metadata. Parent submodules were not initialized.
The parent DevCapsule Nox build gate also passed; no backend source changed.
The manifest and Linux lock were generated/validated using DevCapsule's current
resolver; a separate capsule launch has not been performed.

## Next step

The owner reviews http://127.0.0.1:8080/ in the current parent environment.
Restart with the parent `scripts/website.sh preview`, or `npm run dev` here.
Review and merge this branch, then the parent gitlink/integration PR; handle
GitHub backend wiring and production DNS/TLS using PUBLISHING.md after acceptance.
No production deployment or hosted workflow run has occurred. Future presentation
work and website media belong here.

## Open threads

- Awaiting owner review; no interim design approval needed.
- Final GitHub Actions, PR merges, Pages and DNS/TLS wiring are deliberately deferred.
- Full graphical launch of this project's own capsule remains untested; Node-based
  standalone preview is the practical acceptance path for this cut.
- No separate content copy, database, cloud account, or full chat record is preserved.
