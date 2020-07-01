var unified = require("unified");
var parse = require("rehype-parse");
var rehype2remark = require("rehype-remark");
var stringify = require("remark-stringify");
var mdx = require("@mdx-js/mdx");

const babel = require(`@babel/core`);
const BabelPluginPluckImports = require(`babel-plugin-pluck-imports`);
const objRestSpread = require(`@babel/plugin-proposal-object-rest-spread`);

const htmlAttrToJSXAttr = require(`./babel-plugin-html-attr-to-jsx-attr`);
const removeExportKeywords = require(`babel-plugin-remove-export-keywords`);


module.exports = async (htmlInput, handlers) => {
  const processor = unified()
    .use(parse)
    .use(rehype2remark, { handlers: { ...handlers } })
    .use(stringify);

  const markdown = processor.processSync(htmlInput);
  const compiledMarkdown = await mdx(markdown);

  const instance = new BabelPluginPluckImports();
  const result = babel.transform(compiledMarkdown, {
    configFile: false,
    plugins: [
      instance.plugin,
      objRestSpread,
      htmlAttrToJSXAttr,
      removeExportKeywords,
    ],
    presets: [
      require(`@babel/preset-react`),
      [
        require(`@babel/preset-env`),
        {
          useBuiltIns: `entry`,
          corejs: 2,
          modules: false,
        },
      ],
    ],
  });

  // TODO: be more sophisticated about these replacements
  body = result.code
    .replace(
      /export\s*default\s*function\s*MDXContent\s*/,
      `return function MDXContent`
    )
    .replace(
      /export\s*{\s*MDXContent\s+as\s+default\s*};?/,
      `return MDXContent;`
    );

  return body;
};
