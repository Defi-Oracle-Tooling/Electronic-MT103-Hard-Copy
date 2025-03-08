const unified = require('unified');
const markdown = require('remark-parse');
const frontmatter = require('remark-frontmatter');
const visit = require('unist-util-visit');

class MarkdownProcessor {
  async processFile(content, targetLang) {
    const ast = await this.parseMarkdown(content);
    const translatable = this.extractTranslatableContent(ast);
    const translated = await this.translateNodes(translatable, targetLang);
    return this.reconstructMarkdown(ast, translated);
  }

  private async parseMarkdown(content) {
    return unified()
      .use(markdown)
      .use(frontmatter, ['yaml'])
      .parse(content);
  }

  private extractTranslatableContent(ast) {
    const translatableNodes = [];
    
    visit(ast, node => {
      if (this.isTranslatableNode(node)) {
        const terms = this.extractTerminology(node);
        translatableNodes.push({
          node,
          terms,
          context: this.getTranslationContext(node)
        });
      }
    });

    return this.optimizeForTranslation(translatableNodes);
  }

  private async translateNodes(nodes, targetLang) {
    const glossary = await this.loadTerminologyGlossary(targetLang);
    
    return Promise.all(nodes.map(async node => {
      const preservedTerms = this.preserveTerminology(node.text, glossary);
      const translated = await this.translate(preservedTerms.text, targetLang);
      return this.restoreTerminology(translated, preservedTerms.terms);
    }));
  }

  private preserveTerminology(text, glossary) {
    const terms = [];
    let modifiedText = text;

    glossary.forEach(term => {
      if (text.includes(term.source)) {
        const placeholder = `__TERM_${terms.length}__`;
        terms.push({ placeholder, term });
        modifiedText = modifiedText.replace(term.source, placeholder);
      }
    });

    return { text: modifiedText, terms };
  }
}

module.exports = new MarkdownProcessor();
