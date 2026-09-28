# Developing and testing against a copy of the DevCapsule parent

This site has no content of its own. Every page comes from a checkout of
[ccozianu/devcapsule](https://github.com/ccozianu/devcapsule): the README,
the journal, the release notes and the documentation tree, the last one once
per version the manifest lists. So developing the site means building it
against a copy of the parent, and testing a change means building against a
copy that looks the way the parent will look when the change is published.
This page explains how to get such a copy, what it must contain, and how to
try things without touching the parent.

## 1. Get a copy

The simplest copy is the one the site fetches for you:

```sh
npm ci
npm run content:fetch        # clones DevCapsule into ignored .content/
npm run dev                  # preview at http://127.0.0.1:8080/
```

`content:fetch` checks out `main`. Set `CONTENT_REF=<branch, tag or commit>`
to pick another revision. It refuses to overwrite local edits in `.content/`,
so your experiments there are safe.

If you already have a DevCapsule checkout, point at it instead:

```sh
CONTENT_DIR=/absolute/path/to/devcapsule npm run dev
```

Inside a DevCapsule checkout with the `website` submodule initialised, the
parent's own script does the same thing:

```sh
./scripts/website.sh preview
```

Whichever way you choose, the copy must be a Git repository, and it must
have the tags or branches named in `docs/versions.yaml` (`git fetch --tags`
if in doubt). Released versions are built from those refs, not from the
working tree.

## 2. What the copy has to contain

The build follows [CONTRACT.md](CONTRACT.md) and fails by name on anything
missing. In short, the copy needs:

- `docs/versions.yaml` with `contract: 1`, the current version and one
  entry per published version;
- a front matter block with a `description` on every page under `docs/`,
  on every journal entry and on every `engineering-docs/releases/<tag>/notes.md`;
- the six role pages in the current version (`overview`, `getting-started`,
  `your-project`, `agents`, `containment`, `windows`);
- no typed DevCapsule version in a documentation page; write `{{version}}`
  or `{{tag}}`.

The quickest way to find out what a copy lacks is the same check the
producer's gate runs:

```sh
CONTENT_DIR=/path/to/copy npm run check:content
```

It assembles the whole site without writing anything and prints the first
problem, for example `docs/versions.yaml: missing` or
`docs/platforms/linux.md:6: typed version "v0.9.0"`.

## 3. Work on a copy without touching the parent

To try a content shape the parent does not have yet, for instance a new
manifest or a marker in the README, make a scratch worktree of the fetched
clone and commit your experiments there. Nothing leaves your machine unless
you push, and the site's own checkout stays clean:

```sh
git -C .content worktree add --detach /tmp/content-scratch origin/main
cd /tmp/content-scratch
# edit docs/versions.yaml, README.md, front matter ...
git add -A && git commit -m "scratch: not for pushing"
cd -
CONTENT_DIR=/tmp/content-scratch npm run dev
```

Two things to know:

- A dirty working tree is fine for previewing: `build-info.json` and the
  footer mark the build as dirty. Candidate packaging refuses dirty
  sources, so commit before running a packaging dry run.
- An entry whose `source` is `main` is read from the working tree of the
  copy, so edits show up on the `devel` version straight away. Every other
  entry is read from its Git ref and cached under ignored `.cache/` by
  commit; change the ref, not the files, to see something different there.

When you are done, remove the worktree:

```sh
git -C .content worktree remove /tmp/content-scratch
```

## 4. Test a change

Run the checks in the order they get slower:

```sh
npm test                     # unit tests, including the contract fixture
npm run build && npm run check
npm run check:content        # against whatever CONTENT_DIR points at
npx playwright install chromium   # once
npm run test:browser         # with npm run dev running in another terminal
npm run test:updates         # clean clone of your committed changes
```

`npm test` does not need a content copy at all: it builds a small Git
repository from `test/fixtures/contract-1/` with a legacy tag, a release
tag and a working tree, and provokes every named failure from it. Use it
first, and add a case there when you change how content is read.

`npm run build` writes `_site/`; `npm run check` verifies every local link,
anchor and image, the sitemap and the build identities. For a production
build, which drops drafts and emits the sitemap, set the same variables the
publishing workflow uses:

```sh
SITE_MODE=production SITE_ORIGIN=https://test-devcapsule.mycodespace.ai \
  SITE_BASE_PATH=/ npm run build && npm run check
```

`npm run test:browser` audits representative pages at 1440px and 360px in
both colour schemes for overflow and WCAG A/AA violations, and walks the
switcher, the night-mode switch and navigation without JavaScript. Look at
the screenshots it leaves in `.artifacts/`; automated checks do not judge
whether a page reads well.

`npm run test:updates` clones your committed revision and the content copy
into a temporary directory, runs `npm ci`, and checks that a content edit
and a styling edit each change exactly what they should. Because it clones,
it tests what you committed, not what is in your working tree.

## 5. When the parent itself does not build

The contract is stricter than what the parent may carry at any given moment.
If `check:content` fails on the parent's `main`, that is the parent's
migration item, not a site defect: record what is missing in
[CURRENT-STATUS.md](CURRENT-STATUS.md) as a request to DevCapsule, and keep
developing against a scratch copy that has it. Do not copy authored text into
this repository to work around it; the fixture under `test/fixtures/` is the
only content that lives here, and it is deliberately not DevCapsule's.
