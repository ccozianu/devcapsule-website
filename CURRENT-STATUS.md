# Website current status

State: initial cut in progress; part of DevCapsule's `website` workstream.
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

Initial build and all 582 local links/anchors/assets pass. Four focused routing
and rendering tests pass. Desktop visual inspection performed. Browser checks,
standalone update acceptance, and final clean build are in progress.
The manifest and Linux lock were generated/validated using DevCapsule's current
resolver; a separate capsule launch has not been performed.

## Next step

Finish browser and standalone update checks, record evidence, and push the
reviewable branch. The owner judges the design and reading experience before
production publication. Future presentation work and website media belong here.

## Open threads

- Awaiting owner review after the validation pass; no interim design approval needed.
- Final GitHub Actions, PR merges, Pages and DNS/TLS wiring are deliberately deferred.
- Full graphical launch of this project's own capsule remains untested; Node-based
  standalone preview is the practical acceptance path for this cut.
- No separate content copy, database, cloud account, or full chat record is preserved.
