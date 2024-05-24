'use strict';

const [test, assert] = [require('node:test'), require('node:assert')];
const Schema = require('../../..');

test('[Metatest] Schema without errors & warnings', () => {
  const userSchema = new Schema({
    $id: 'UserSchema',
    phone: { $type: 'union', types: ['number', 'string'] }, //? anyof types
    name: { $type: 'set', items: ['string', '?string'] }, //? set tuple
    mask: { $type: 'array', items: 'string' }, //? array
    ip: {
      id: 'IpSchema',
      $type: 'array',
      required: false,
      rules: [ip => ip[0] === '192'], //? custom rules
      items: {
        $type: 'union',
        types: ['string', 'number', null],
        condition: 'oneof',
        $required: false,
      },
    },
    type: ['elite', 'member', 'guest'], //? enum
    address: 'string',
    secondAddress: '?string',
    associations: new Schema({
      $id: 'UserID',
      '[a-z]+Id': { $type: 'number', isPattern: true },
    }),
    options: { notifications: 'boolean', lvls: ['number', 'string'] },
  });

  const sample = [
    {
      phone: '7(***)...',
      ip: ['192', 168, '1', null],
      type: 'elite',
      mask: ['255', '255', '255', '0'],
      name: new Set(['Alexander', undefined]),
      options: { notifications: true, lvls: [2, '["admin", "user"]'] },
      associations: { userId: 1, recordId: 1, dbId: 1 },
      address: 'Pushkin street',
    },
    {
      phone: 79999999999,
      type: 'guest',
      mask: ['255', '255', '255', '0'],
      name: new Set(['Alexander', 'Ivanov']),
      options: { notifications: false, lvls: [2, '["admin", "user"]'] },
      associations: { userId: 2, recordId: 2, dbId: 2 },
      address: 'Pushkin street',
    },
  ];

  const systemSchema = new Schema({ $type: 'array', items: userSchema });
  const ipSchema = systemSchema.pull('IpSchema');
  const usSchema = systemSchema.pull('UserSchema');
  const UserID = systemSchema.pull('UserID');
  assert.strictEqual(systemSchema.warnings.length, 0);
  assert.strictEqual(userSchema.warnings.length, 0);
  assert.strictEqual(UserID.test(sample[0].associations).valid, true);
  assert.strictEqual(ipSchema.test(sample[0].ip).valid, true);
  assert.strictEqual(usSchema.test(sample[0]).valid, true);
  assert.strictEqual(userSchema.test(sample[0]).valid, true);
  assert.strictEqual(systemSchema.test(sample).valid, true);
});
