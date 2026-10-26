#!/bin/sh
set -eu
mkdir -p docs/_pdf_previews
find backend/templates -type f -name original.pdf | sort | while read -r file; do
  form_id=$(printf '%s' "$file" | cut -d / -f 3)
  destination="docs/_pdf_previews/$form_id"
  mkdir -p "$destination"
  pdftoppm -f 1 -l 2 -r 110 -scale-to 1200 -png "$file" "$destination/page" 2>/dev/null
done
