#!/bin/bash

# Configuration
DOCS_DIR="docs"
SOURCE_LANG="en"
MIN_QUALITY_SCORE=0.8

check_translation_quality() {
    local source_file=$1
    local translated_file=$2
    local lang=$3

    # Run automated checks
    node ./src/localization/quality-checker.js \
        --source "$source_file" \
        --translation "$translated_file" \
        --lang "$lang" \
        --min-score "$MIN_QUALITY_SCORE"
}

check_all_translations() {
    find "docs/${SOURCE_LANG}" -type f -name "*.md" | while read -r source; do
        for lang_dir in docs/*/; do
            lang=$(basename "$lang_dir")
            [ "$lang" = "$SOURCE_LANG" ] && continue

            translated="${source/${SOURCE_LANG}/${lang}}"
            if [ -f "$translated" ]; then
                check_translation_quality "$source" "$translated" "$lang"
            fi
        done
    done
}

main() {
    check_all_translations
    exit_code=$?
    [ $exit_code -eq 0 ] && echo "Quality check passed!" || echo "Quality check failed!"
    exit $exit_code
}

main
