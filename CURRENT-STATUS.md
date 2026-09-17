# Website current status

State: test site working; production promotion prepared as part of DevCapsule's
`website` workstream. Branch: `production-pages`. Delivery: owner merges PR to `main`.
Independent future development: `single-stream`; transition not yet performed.

## Current result

Eleventy renders the parent README, guides and development blog. The custom
responsive presentation, navigation, code highlighting/copying, local preview,
source-link conversion and build identities are implemented. Content stays in
DevCapsule. The owner reports the test deployment works well; HTTPS and its
manifest were independently checked on 2026-09-17. Initial website and parent
PRs are merged. Production publication remains an owner action.

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

## Production promotion slice (2026-09-17)

The owner requested a publishing action here for `devcapsule.mycodespace.ai`.
Only `mycodespace.ai` is owned; other domain spellings in conversation were typos.
`.github/workflows/publish.yml` manually promotes a retained parent test run.
It verifies workflow success including deployment, artifact digest, source
revisions and metadata, then changes canonical origins and adds provenance.
It does not rebuild the tested content/assets. The parent workflow is unchanged.

Seven unit tests pass, including byte preservation and rejection of mismatched,
dirty, preview-mode, subpath and unexpected-origin candidates. A clean temporary
checkout of the exact deployed content and implementation built successfully;
promotion of that local fixture and all 582 links across 16 HTML pages passed.
This fixture was rebuilt locally, not downloaded using the owner's token.
The workflow passes actionlint 1.7.12. No visual changes were made, so browser
audits were not repeated.
Authenticated cross-repository artifact download and the production Actions
run remain unverified until owner setup and dispatch. The reviewed source
artifact expires after seven days; there is no permanent rollback archive.

## Next step

Merge `production-pages`, then follow [PUBLISHING.md](PUBLISHING.md): configure
this repository's Pages custom domain and DNS, add repository secret
`CANDIDATE_READ_TOKEN` with Actions: read on `ccozianu/devcapsule`, and run
**Publish production website** from `main` with the reviewed test run ID.
Known successful test run: `35187865183`, artifact expires 2026-09-24.
Do not dispatch production on the owner's behalf during this delivery.

## Open threads

- Owner handles production PR merge, Pages/DNS/TLS, secret and initial dispatch.
- The current test deployment allows indexing because the parent workflow uses
  production mode to publish; separate noindex support is outside this slice.
- Formal autonomy-experiment acceptance/finalization remains with the owner.
- Full graphical launch of this project's own capsule remains untested; Node-based
  standalone preview is the practical acceptance path for this cut.
- No separate content copy, database, cloud account, or full chat record is preserved.
