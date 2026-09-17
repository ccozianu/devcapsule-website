# Developer brief

Build a small, readable website that makes DevCapsule easier to understand,
try, and follow. Visitors should find current starting instructions quickly.
The project is a static Eleventy site; its content is authored in DevCapsule.
Read [README.md](README.md) for setup, commands, architecture and content contract,
then [CURRENT-STATUS.md](CURRENT-STATUS.md) for the current handoff.

Keep content ownership and presentation separate. No server runtime, database,
comments, analytics, or account system is required. Plain HTML remains usable
without JavaScript. JavaScript enhances code copying and the section indicator.
Do not expand the product claims, rewrite the current-release tutorials, or
publish production without owner acceptance.

Use the existing Node dependency lock. Run `npm test`, `npm run build`, and
`npm run check` for build/routing changes. For layout or interaction changes,
inspect desktop/mobile screenshots and run the browser checks against the
preview. Run the update acceptance check when changing content consumption.
Candidate packaging/promotion tests also use GNU tar, as provided by the Linux
capsule and Ubuntu Actions runner. Stop testing when the relevant evidence is
sufficient. No Docker build is
needed to work on the site; the committed DevCapsule setup is an optional
reproducible development environment.

The initial implementation belongs to DevCapsule's website workstream.
Independent future work uses single-stream status here; record the transition
when the owner accepts the handoff. Commit coherent slices, keep the state
resumable, and deliver changes by pull request. The owner handles PR creation
and merge when SSH-only agent access is available.
