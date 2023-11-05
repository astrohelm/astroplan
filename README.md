<h1 align="center">MetaForge v0.5.0 🕵️</h1>

## Describe your data structures by subset of JavaScript and:

- 📝 Generate data relational structures (types, jsdoc, diagrams, migrations, etc.)
- 🔎 Validate it in runtime with strict & partial validations
- 👀 Send it to other server to validate data consistency
- 🛠️ Handle it with custom modules
- 💉 Calculate fields

## Installation

```bash
npm i metaforge --save
```

## Usage example

```js
const userSchema = new Schema({
  $id: 'userSchema',
  $meta: { name: 'user', description: 'schema for users testing' },
  phone: { $type: 'union', types: ['number', 'string'] }, //? anyof tyupe
  name: { $type: 'set', items: ['string', '?string'] }, //? set tuple
  mask: { $type: 'array', items: 'string' }, //? array
  ip: {
    $type: 'array',
    $required: false,
    $rules: [ip => ip[0] === '192'], //? custom rules
    items: { $type: 'union', types: ['string', '?number'], condition: 'oneof', $required: false },
  },
  type: ['elite', 'member', 'guest'], //? enum
  adress: 'string',
  secondAdress: '?string',
  options: { notifications: 'boolean', lvls: ['number', 'string'] },
});

const systemSchema = new Schema({ $type: 'array', items: userSchema });

const sample = [
  {
    phone: '7(***)...',
    ip: ['192', 168, '1', null],
    type: 'elite',
    mask: ['255', '255', '255', '0'],
    name: new Set(['Alexander', null]),
    options: { notifications: true, lvls: [2, '["admin", "user"]'] },
    adress: 'Pushkin street',
  },
  //...
];

systemSchema.warnings; // inspect after build warnings
systemSchema.test(sample); // Shema validation
systemSchema.toTypescript('system'); // Typescript generation
systemSchema.pull('userSchema').test(sample[0]); // Subschema validation
systemSchema.pull('userSchema').test({ phone: 123 }, 'root', true); // Partial validation
systemSchema.pull('userSchema'); // Metadata: {..., name: 'user', description: 'schema for users testing'}
```

## Docs

- [About modules](./docs/modules.md#modules-or-another-words-plugins)
  - [Handyman](./modules/handyman/README.md) | quality of life module
  - [Metatest](./modules/test/README.md) | adds prototype testing
  - [Metatype](./modules/types/README.md) | generate typescript:JSDOC from schema
  - [Writing custom modules](./docs/prototypes.md#writing-custom-modules)
- [About prototypes](./docs/prototypes.md#readme-map)
  - [Schemas contracts](./docs/prototypes.md#schemas-contracts)
  - [How to build custom prototype](./docs/prototypes.md#writing-custom-prototypes)

## Copyright & contributors

<p align="center">
Copyright © 2023 <a href="https://github.com/astrohelm/metaforge/graphs/contributors">Astrohelm contributors</a>.
This library is <a href="./LICENSE">MIT licensed</a>.<br/>
And it is part of <a href="https://github.com/astrohelm">Astrohelm ecosystem</a>.
</p>
