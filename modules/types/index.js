'use strict';

const { nameFix, jsdoc } = require('./utils');
const types = require('./types');

module.exports = ({ forge }) => {
  forge.attach('after', TypescriptWrapper);
  forge.attach('before', { toTypescript: () => 'unknown' });
  types.forEach(([name, proto]) => void forge.attach(name, proto));
  return schema => void (schema.dts = DTS.bind(schema));
};

function TypescriptWrapper() {
  const compile = this.toTypescript;
  this.toTypescript = (name, namespace) => compile(nameFix(name), namespace);
}

function DTS(name = 'MetaForge', { exportMode = 'all', exportType = 'mjs' } = {}) {
  if (name !== nameFix(name)) throw new Error('Invalid name format');
  const namespace = { definitions: new Set(), exports: new Set() };
  const type = this.toTypescript(name, namespace);
  const { definitions, exports } = namespace;
  const meta = this.meta;
  exports.add(name);

  if (type !== name) definitions.add(`${meta ? jsdoc(meta) : ''}type ${name} = ${type};`);
  var result = Array.from(definitions).join('\n\n');
  if (exportMode === 'no') return result;
  if (exportMode !== 'default-only' && exportType === 'mjs') {
    result += `\nexport type { ${Array.from(exports).join(', ')} };`;
  }
  if (exportMode !== 'exports-only') {
    if (exportType === 'mjs') return result + `\nexport default ${name};`;
    return result + `\nexport = ${name};`;
  }
  return result;
}
