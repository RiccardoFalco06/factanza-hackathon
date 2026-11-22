const assert = require('assert');
const { rank } = require('./app.js');
const s = { ideas: [{id:'a',text:'A'},{id:'b',text:'B'},{id:'c',text:'C'}], names: [{id:'x',text:'X'},{id:'y',text:'Y'}],
  ticks: { 'b|x': true, 'b|y': true, 'c|x': true, 'a|y': true } };
const r = rank(s);
assert.deepStrictEqual(r.map(o => o.idea.id), ['b', 'a', 'c']);
assert.deepStrictEqual(r.map(o => o.pos), [1, 2, 2]);
assert.deepStrictEqual(r[0].voters.map(v => v.id), ['x', 'y']);
console.log('ok');
const { apply, empty } = require('./app.js');
const t = empty();
assert(apply(t, { type: 'add', kind: 'name', id: 'n1', text: 'Bianca' }));
assert(!apply(t, { type: 'add', kind: 'name', id: 'BAD ID', text: 'x' }));
apply(t, { type: 'import', state: { ideas: [{ id: 'i9', text: 'Idea A' }], names: [{ id: 'n9', text: 'bianca' }, { id: 'n8', text: 'Marco' }], ticks: { 'i9|n9': true, 'i9|n8': true } } });
assert.strictEqual(t.names.length, 2); // "bianca" unita a "Bianca"
assert.deepStrictEqual(Object.keys(t.ticks).sort(), ['i9|n1', 'i9|n8']);
apply(t, { type: 'del', kind: 'name', id: 'n1' });
assert.deepStrictEqual(Object.keys(t.ticks), ['i9|n8']);
console.log('apply ok');
