# Changesets

Each pull request that changes what users get adds a changeset: run `yarn changeset`, pick the bump (patch for fixes, minor for features; while the package is 0.x, minor also covers breaking changes) and write one or two sentences for the changelog.

The release workflow turns pending changesets into a "Version Packages" pull request. Merging it bumps the version, updates `CHANGELOG.md` and publishes to npm. See [RELEASING.md](../RELEASING.md).
