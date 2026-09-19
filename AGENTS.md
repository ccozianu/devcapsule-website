# Agent instructions

Read `README.md`, `DEVELOPING.md`, `.devcapsule/devcapsule.toml`, and
`CURRENT-STATUS.md` before editing. This project uses single-stream handoff.
The initial cut was part of the parent DevCapsule website workstream. On
2026-09-19 the owner authorized a direct submodule handoff: website-owned tasks
are authoritative in `BACKLOG.md` here; DevCapsule retains content and its small
caller integration. Read the backlog and open bugs under `engineering-docs/bugs/`
alongside the status. This project's single-stream bug records use `owner: none`.
The transfer exception does not authorize future autonomous switches between
repositories/workstreams; follow the user's selected scope.

Follow `REQUIREMENTS.md` and the content contract. Author product content in
DevCapsule, not as a second copy here. Keep presentation and integration small.
Use Git branches and reviewable commits; preserve unrelated user changes.
No production publication without explicit acceptance. SSH access is sufficient;
prepare PR compare links for the owner if API access is absent.

Run the relevant checks in `DEVELOPING.md` and inspect rendered results for
visual changes. Update `CURRENT-STATUS.md` at meaningful checkpoints, including
what passed, what remains unverified, and the next action. Maintain `index.md`
when adding, removing or moving permanent Markdown documentation.
