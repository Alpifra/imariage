#!/usr/bin/env bash
# Runs on the server, from the deploy directory where the CI uploaded it next to the release archive.
# Usage: deploy.sh <archive> <php binary>
set -euo pipefail

KEEP_RELEASES=3
archive=$1
php_bin=$2

cd "$(dirname "$0")"
root=$(pwd)
[ -f shared/.env.local ] || { echo "Missing $root/shared/.env.local, see infrastructure/deploy/README.md" >&2; exit 1; }
mkdir -p releases shared/storage

# A fresh directory per deploy: redeploying the same commit must not touch the one being served
release="releases/$(date +%Y%m%d%H%M%S)-$(basename "$archive" .tar.gz | cut -c1-7)"
mkdir "$release"
tar -xzf "$archive" -C "$release"
rm "$archive"
cd "$release"

ln -s "$root/shared/.env.local" .env.local
mkdir -p var
ln -s "$root/shared/storage" var/storage

# The CLI default is an older PHP: composer and the Symfony scripts must use the same binary as the site
export PATH="$(dirname "$php_bin"):$PATH"
composer install --no-dev --optimize-autoloader --no-interaction --no-progress
"$php_bin" bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration

cd "$root"
ln -sfn "$release" current.next
mv -Tf current.next current
echo "Now serving $release"

current_target=$(readlink current)
for old in $(ls -1dt releases/*/ | tail -n +$((KEEP_RELEASES + 1))); do
    if [ "${old%/}" != "$current_target" ]; then rm -rf "$old"; fi
done
