'use strict';

const { brackets, jsdoc, titlify } = require('./utils');
const or = (max, i) => (max === i ? '' : '|');
const enumerable = {
  toTypescript() {
    const $enum = this.enum;
    const max = $enum.length - 1;
    const type = $enum.reduce((acc, v, i) => acc + brackets(v, !1) + or(max, i), '');
    return '(' + type + ')';
  },
};

const iterable = {
  toTypescript(name, namespace) {
    const types = this.items.map((item, i) => item.toTypescript(`${name}Item${i}`, namespace));
    if (this.type === 'set') return `Set<${types.join('|')}>`;
    return this.isTuple ? `[${types.join(',')}]` : `(${types.join('|')})[]`;
  },
};

const SPACING = '  ';
const struct = {
  toTypescript(name, namespace) {
    const { meta, properties } = this;
    var result = `interface ${name} {\n`;
    if (meta) result = jsdoc(meta) + result;
    properties.forEach((proto, key) => {
      const field = brackets(key, !0) + (proto.required ? ': ' : '?: ');
      const type = proto.toTypescript(name + titlify(key), namespace);
      if (proto.meta) result += jsdoc(proto.meta, SPACING);
      result += `${SPACING + field + type};\n`;
    });
    namespace.definitions.add(result + '};');
    return name;
  },
};

const union = {
  toTypescript(name, namespace) {
    const types = this.types.map((type, i) => type.toTypescript(`${name}Type${i}`, namespace));
    return `(${types.join(this.condition === 'allof' ? '&' : '|')})`;
  },
};

function Schema() {
  const compile = this.toTypescript;
  this.toTypescript = (name, namespace) => {
    const id = this.id ?? name;
    const type = compile(id, namespace);
    if (!this.id) return type;
    if (type !== id) namespace.definitions.add(`type ${id} = ${type};`);
    return namespace.exports.add(id), id;
  };
}

const create = type => ({
  toTypescript() {
    return this.required ? type : `(${type}|undefined)`;
  },
});

module.exports = [
  ['null', create('null')],
  ['unknown', create('unknown')],
  ['boolean', create('boolean')],
  ['string', create('string')],
  ['number', create('number')],
  ['bigint', create('bigint')],
  ['any', create('any')],
  ['enum', enumerable],
  ['array', iterable],
  ['tuple', iterable],
  ['set', iterable],
  ['schema', Schema],
  ['object', struct],
  ['map', struct],
  ['union', union],
];
