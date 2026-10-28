#!/bin/sh
# Pin the Portuguese model used by local validation, Ubuntu CI and Alpine runtime.
# Keep the distribution's OSD data and TSV configs; replace only por.traineddata.
set -eu
[ "$#" -eq 1 ] && [ -d "$1" ] || {
  echo 'Usage: sh install-ocr-model.sh EXISTING_TESSDATA_DIRECTORY' >&2
  exit 2
}
directory=$1
sha=c4932b937207a9514b7514d518b931a99938c02a28a5a5a553f8599ed58b7deb
url=https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/por.traineddata
if printf '%s  %s\n' "$sha" "$directory/por.traineddata" | sha256sum -c - >/dev/null 2>&1; then
  echo 'OCR Portuguese model: verified tessdata_fast 4.1.0'
  exit 0
fi
temporary=$(mktemp "$directory/.por-model-XXXXXX")
trap 'rm -f "$temporary"' EXIT HUP INT TERM
wget -q -T 30 -O "$temporary" "$url"
printf '%s  %s\n' "$sha" "$temporary" | sha256sum -c -
chmod 644 "$temporary"
mv -f "$temporary" "$directory/por.traineddata"
echo 'OCR Portuguese model: installed verified tessdata_fast 4.1.0'
