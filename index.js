var unified = require("unified");
var parse = require("rehype-parse");
var rehype2remark = require("rehype-remark");
var stringify = require("remark-stringify");
var mdx = require("@mdx-js/mdx");
var toHtml = require("hast-util-to-html");
const resolve = require("hast-util-to-mdast/lib/util/resolve");
const all = require("hast-util-to-mdast/lib/all");

const babel = require(`@babel/core`);
const BabelPluginPluckImports = require(`babel-plugin-pluck-imports`);
const objRestSpread = require(`@babel/plugin-proposal-object-rest-spread`);

const htmlAttrToJSXAttr = require(`./babel-plugin-html-attr-to-jsx-attr`);
const removeExportKeywords = require(`babel-plugin-remove-export-keywords`);

function iframe(h, node) {
  return h(node, "html", toHtml(node, { space: "html" }));
}

function a(h, node) {
  console.log(JSON.stringify(node, null, 2), "node is here");
  //   console.log(h(node, 'html', toHtml(node, {space: 'html'})), 'test')

  if (
    node.properties &&
    node.properties.className &&
    node.properties.className.includes("kg-bookmark-container")
  ) {
    return { type: "html", value: "<Hola/>" };
  } else {
    var props = {
      title: node.properties.title || null,
      url: resolve(h, node.properties.href),
    };
    return h(node, "link", props, all(h, node));
  }
  // return h(node, 'html', toHtml(node, {space: 'html'}))
}

var processor = unified()
  .use(parse)
  .use(rehype2remark, { handlers: { iframe, a } })
  .use(stringify);

module.exports = async (htmlInput) => {
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
