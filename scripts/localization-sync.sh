#!/bin/bash

SOURCE_LANG="en"
DOCS_DIR="docs"
LANGUAGES=("es" "pt-br" "fr" "de" "it" "ja" "ko" "th" "tl" "zh-cn" "ar" "he" "tr" "fa" "sw" "hi")

# Check for changes in source files
check_source_changes() {
    git diff --name-only HEAD~1 HEAD | grep "^docs/${SOURCE_LANG}/"
}

# Sync translations for modified files
sync_translations() {
    local changed_files=$1
    for lang in "${LANGUAGES[@]}"; do
        echo "Syncing ${lang} translations..."
        while IFS= read -r file; do
            relative_path=${file#docs/${SOURCE_LANG}/}
            ./translate-md.sh "$file" "docs/${lang}/${relative_path}" "$lang"
        done <<< "$changed_files"
    done
}

main() {
    changed_files=$(check_source_changes)
    if [ -n "$changed_files" ]; then
        sync_translations("$changed_files")
        ./quality-check.sh
    fi
}

main
