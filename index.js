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

  return { type: "html", value: "<Hola/>" };
  // return h(node, 'html', toHtml(node, {space: 'html'}))
  //   var props = {
  //     title: node.properties.title || null,
  //     url: resolve(h, node.properties.href)
  //   }
  //   return h(node, 'link', props, all(h, node))
}

var processor = unified()
  .use(parse)
  .use(rehype2remark, { handlers: { iframe, a } })
  .use(stringify);

const compileMdx = async (htmlInput) => {
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

compileMdx(`<pre><code class=\"language-javascript\">async function meriUmbrella(){\n    const kabTakChalegi = await fetch(\"\");\n    console.log(kabTakChalegi);\n}</code></pre><figure class=\"kg-card kg-bookmark-card\"><a class=\"kg-bookmark-container\" href=\"https://ontraveldiary.com/bir-billing-paragliding-heaven-soar-like-a-bird-part-i/\"><div class=\"kg-bookmark-content\"><div class=\"kg-bookmark-title\">Bir Billing Paragliding Heaven - Soar Like a Bird - Part I</div><div class=\"kg-bookmark-description\">Bir Billing, the Paragliding destination of India is a lesser known place. Bir &amp; Billing, Himachal Pradesh are sleepy little towns which are abuzz with adventure lovers.</div><div class=\"kg-bookmark-metadata\"><img class=\"kg-bookmark-icon\" src=\"https://ontraveldiary.com/icons/icon-512x512.png\"><span class=\"kg-bookmark-author\">Arun Yadav</span><span class=\"kg-bookmark-publisher\">Travel Diary - Your Digital Travelogue!!</span></div></div><div class=\"kg-bookmark-thumbnail\"><img src=\"https://res-5.cloudinary.com/hlhrajeg1/image/upload/q_auto/v1/ghost-blog-images/lalita-paragliding-in-bir-billing-himachal-india.jpg\"></div></a></figure><h1>Test
</h1>`).then((v) => console.log(v));
