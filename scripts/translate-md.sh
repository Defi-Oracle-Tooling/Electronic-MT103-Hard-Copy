#!/bin/bash

set -e

SOURCE_FILE=$1
TARGET_FILE=$2
TARGET_LANG=$3

translate_file() {
    mkdir -p "$(dirname "$TARGET_FILE")"
    
    node -e "
        const { TranslationManager } = require('../src/services/localization/translation-manager');
        const { MarkdownProcessor } = require('../src/localization/markdown-processor');
        
        async function translateFile() {
            const content = await require('fs').promises.readFile('$SOURCE_FILE', 'utf8');
            const manager = new TranslationManager();
            const processor = new MarkdownProcessor();
            
            const processed = await processor.processFile(content, '$TARGET_LANG');
            const translated = await manager.translateContent(processed, '$TARGET_LANG');
            
            await require('fs').promises.writeFile('$TARGET_FILE', translated);
        }
        
        translateFile().catch(console.error);
    "
}

main() {
    echo "Translating $SOURCE_FILE to $TARGET_LANG..."
    translate_file
    echo "Translation saved to $TARGET_FILE"
    ./quality-check.sh "$SOURCE_FILE" "$TARGET_FILE" "$TARGET_LANG"
}

main
