'use strict';

const [test, assert] = [require('node:test'), require('node:assert')];
const Schema = require('../..');

test('[Handyman] Schema with namespace', () => {
  const namespace = { User: new Schema('string') };
  const schema = new Schema(['User', 'User'], { namespace });
  const sample = ['Alexander', 'Ivanov'];

  assert.strictEqual(namespace.User.warnings.length + schema.warnings.length, 0);
  assert.strictEqual(schema.test(sample).length, 0);
});

test('[Handyman] Pull schemas', () => {
  const schema = new Schema({
    $id: 'MySchema',
    a: 'string',
    b: { $id: 'MySubSchema', c: 'number' },
    c: new Schema('?string'),
    d: { $type: 'schema', schema: new Schema('number'), id: 'MySubSchema2' },
    e: { $type: 'schema', schema: new Schema({ $type: 'number', id: 'MySubSchema3' }) },
  });

  assert.strictEqual(schema.warnings.length, 0);
  assert.strictEqual(!!schema.pull('MySchema'), true);
  assert.strictEqual(!!schema.pull('MySubSchema'), true);
  assert.strictEqual(!!schema.pull('MySubSchema2'), true);
  assert.strictEqual(!!schema.pull('MySubSchema3'), true);
});

test('[Handyman] Shorthands', () => {
  const schema = new Schema(
    {
      a: 'string', //? scalar shorthand
      b: '?string', //? optional shorthand
      c: ['string', 'string'], //? tuple
      d: new Schema('?string'), //? Schema shorthand
      e: ['winter', 'spring'], //? Enum shorthand
      f: { a: 'number', b: 'string' }, //? Object shorthand
      g: { $type: 'array', items: 'string' }, //? Array items shorthand
      h: 'MyExternalSchema', //? Namespace schema
      j: () => 2 + 2, //? Calculated field
    },
    { namespace: { MyExternalSchema: new Schema('string') } },
  );
  assert.strictEqual(schema.warnings.length, 0);
});

test('[Handyman] Calculated fields (basic)', () => {
  const string = new Schema({ $type: 'string', calc: schema => 'Hello ' + schema });
  assert.strictEqual(string.warnings.length, 0);
  assert.strictEqual(string.calculate('Alexander'), 'Hello Alexander');
  const enumerable = new Schema({ $type: 'enum', enum: ['Alexander', 'John'], calc: 'John' });
  assert.strictEqual(enumerable.warnings.length, 0);
  assert.strictEqual(enumerable.calculate('Alexander'), 'John');
  const union = new Schema({ $type: 'union', types: ['string', 'number'], calc: 'John' });
  assert.strictEqual(union.warnings.length, 0);
  assert.strictEqual(union.calculate('Alexander'), 'John');
  const object = new Schema({
    name: 'string',
    phrase: (_, parent) => 'Hello ' + parent.name + ' !',
    phrase2: { $type: 'string', calc: (_, schema) => 'Hello there ' + schema.name + ' !' },
    phrase3: {
      $type: 'schema',
      schema: new Schema('string'),
      calc: (_, schema) => 'Hi ' + schema.name + ' !',
    },
    phrase4: new Schema({ $type: 'string', calc: (_, schema) => 'Ni hao ' + schema.name + ' !' }),
  });
  assert.strictEqual(object.warnings.length, 0);
  assert.deepStrictEqual(object.calculate({ name: 'Alexander' }), {
    name: 'Alexander',
    phrase: 'Hello Alexander !',
    phrase2: 'Hello there Alexander !',
    phrase3: 'Hi Alexander !',
    phrase4: 'Ni hao Alexander !',
  });
});

test('[Handyman] Calculated fields (extended)', () => {
  const arr = new Schema({
    $type: 'array',
    items: 'string',
    calc: schema => (schema.unshift('Hello'), schema),
  });

  assert.strictEqual(arr.warnings.length, 0);
  assert.deepStrictEqual(arr.calculate(['Alexander']), ['Hello', 'Alexander']);

  const arr2 = new Schema({
    $type: 'array',
    items: { $type: 'number', calc: schema => schema + 2 },
    calc: schema => (schema.unshift(2), schema),
  });
  assert.strictEqual(arr2.warnings.length, 0);
  assert.deepStrictEqual(arr2.calculate([2]), [4, 4]);

  const arr3 = new Schema({
    $type: 'array',
    items: {
      name: 'string',
      $calc: schema => {
        schema.phrase = 'Hello ' + schema.name;
        return schema;
      },
    },
  });
  assert.strictEqual(arr3.warnings.length, 0);
  assert.deepStrictEqual(arr3.calculate([{ name: 'Alexander' }, { name: 'John' }]), [
    { name: 'Alexander', phrase: 'Hello Alexander' },
    { name: 'John', phrase: 'Hello John' },
  ]);
});
