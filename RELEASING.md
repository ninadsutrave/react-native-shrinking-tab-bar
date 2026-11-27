# Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published from GitHub Actions with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers), so no npm token is stored anywhere.

## How a release happens

1. Pull requests that change what users get include a changeset (`yarn changeset`).
2. When they land on `main`, the Release workflow opens or updates a **Version Packages** pull request. It bumps the version and moves the changesets into `CHANGELOG.md`.
3. Merging that pull request publishes the new version to npm.

## Switching releases on (once)

The Release workflow does nothing until you finish these steps, so pushing to `main` can never publish by accident.

1. **First publish by hand.** npm only lets you set up trusted publishing for a package that exists:

   ```sh
   yarn prepare
   npm publish --access public
   ```

   This publishes the version in `package.json` (0.1.0).

2. **Add the trusted publisher** on npmjs.com: the package's Settings → Trusted publishing → GitHub Actions, with:
   - Organization or user: `ninadsutrave`
   - Repository: `react-native-shrinking-tab-bar`
   - Workflow filename: `release.yml`

3. **Turn the workflow on:** in the GitHub repository, Settings → Secrets and variables → Actions → Variables, add `NPM_RELEASE` with the value `enabled`.

4. **Optional, after making the repository public:** npm adds [provenance](https://docs.npmjs.com/generating-provenance-statements) to trusted-publishing releases automatically for public repositories. While the repository is private, releases publish without it.

## Versioning

The package follows [Semantic Versioning](https://semver.org/). While it's 0.x, a minor release may contain breaking changes; the changelog calls them out. 1.0 comes once the supported platforms in the README's requirements table are all tested.
