const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../js/core.js');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/database.json'), 'utf8'));
const now = new Date('2026-10-28T12:00:00');
const fresh = () => Core.createDatabase(seed, now);

test('o JSON inicial gera uma base válida sem modificar os exemplos', () => {
  const db = fresh();
  assert.ok(Core.validateDatabase(db));
  assert.equal(db.products[0].batches[0].expiresAt, '2026-10-31');
  assert.equal(seed.products[0].batches[0].expiresInDays, 3);
  assert.equal(db.orders.length, 0);
});
test('estoque vencido não entra no disponível; a validade inclui o dia informado', () => {
  const product = fresh().products.find((item) => item.id === 'flores-campo');
  assert.equal(Core.stock(product, now), 22);
  assert.equal(Core.expiredStock(product, now), 3);
  assert.ok(Core.isAvailable({ quantity: 1, expiresAt: '2026-10-28' }, now));
  assert.ok(!Core.isAvailable({ quantity: 1, expiresAt: '2026-10-27' }, now));
});
test('carrinho soma valores em centavos sem baixar estoque antecipadamente', () => {
  const db = fresh();
  Core.setCartQuantity(db, 'rosa', 2, now);
  Core.setCartQuantity(db, 'buque-afeto', 1, now);
  assert.equal(Core.cartTotal(db), 11390);
  assert.equal(Core.stock(db.products[0], now), 30);
  Core.setCartQuantity(db, 'rosa', 0, now);
  assert.equal(db.cart.length, 1);
  assert.equal(Core.cartTotal(db), 8990);
});
test('bloqueia quantidades inválidas e produtos esgotados', () => {
  const db = fresh();
  for (const quantity of [-1, 1.5, NaN, 10000, 31]) assert.throws(() => Core.setCartQuantity(db, 'rosa', quantity, now));
  assert.throws(() => Core.setCartQuantity(db, 'cartao', 1, now));
  assert.throws(() => Core.setCartQuantity(db, 'inexistente', 1, now));
  assert.equal(db.cart.length, 0);
});
test('finalização usa primeiro a menor validade e preserva um histórico do preço', () => {
  const db = fresh();
  // Invertemos os lotes para comprovar que a ordem do JSON não determina a saída.
  db.products[0].batches.reverse();
  Core.setCartQuantity(db, 'rosa', 20, now);
  const order = Core.checkout(db, '  Ana  ', now);
  assert.equal(order.id, 1001);
  assert.equal(order.customerName, 'Ana');
  assert.equal(order.total, 24000);
  assert.deepEqual(order.items[0].allocations, [{ batchId: 'RO-001', quantity: 18 }, { batchId: 'RO-002', quantity: 2 }]);
  assert.equal(Core.stock(db.products[0], now), 10);
  assert.equal(db.cart.length, 0);
  db.products[0].price = 2000;
  assert.equal(order.items[0].unitPrice, 1200);
  assert.equal(db.orders.length, 1);
});
test('falha na finalização é atômica e não baixa produtos parcialmente', () => {
  const db = fresh();
  Core.setCartQuantity(db, 'rosa', 2, now);
  Core.setCartQuantity(db, 'buque-afeto', 2, now);
  db.products.find((item) => item.id === 'buque-afeto').batches[0].quantity = 1;
  const before = JSON.stringify(db);
  assert.throws(() => Core.checkout(db, '', now), /estoque/);
  assert.equal(JSON.stringify(db), before);
});
test('um lote que vence enquanto o carrinho está aberto é revalidado no fechamento', () => {
  const db = fresh();
  Core.setCartQuantity(db, 'arranjo-amanhecer', 1, now);
  const before = JSON.stringify(db);
  assert.throws(() => Core.checkout(db, '', new Date('2026-10-31T12:00:00')), /estoque/);
  assert.equal(JSON.stringify(db), before);
});
test('fechamento vazio ou repetido não gera pedido adicional', () => {
  const db = fresh();
  assert.throws(() => Core.checkout(db, '', now));
  Core.setCartQuantity(db, 'rosa', 1, now);
  Core.checkout(db, '', now);
  assert.throws(() => Core.checkout(db, '', now));
  assert.equal(db.orders.length, 1);
});
test('entrada de lote valida quantidade, código duplicado e validade de perecíveis', () => {
  const db = fresh();
  assert.throws(() => Core.saveBatch(db, 'rosa', { id: 'NOVO', quantity: 3, expiresAt: null }));
  assert.throws(() => Core.saveBatch(db, 'rosa', { id: 'NOVO', quantity: 3, expiresAt: '2026-02-31' }));
  assert.throws(() => Core.saveBatch(db, 'rosa', { id: 'RO-001', quantity: 3, expiresAt: '2026-11-08' }));
  assert.throws(() => Core.saveBatch(db, 'rosa', { id: 'NOVO', quantity: -3, expiresAt: '2026-11-08' }));
  Core.saveBatch(db, 'rosa', { id: 'RO-003', quantity: 5, expiresAt: '2026-11-08' });
  assert.equal(Core.stock(db.products[0], now), 35);
});
test('ajuste do lote pode zerar e ajusta a reserva do carrinho sem apagar pedidos', () => {
  const db = Core.createDatabase(seed);
  Core.setCartQuantity(db, 'buque-afeto', 5);
  Core.saveBatch(db, 'buque-afeto', { id: 'BA-001', quantity: 2, expiresAt: Core.offsetDate(5), editing: true });
  assert.equal(db.cart[0].quantity, 2);
  Core.saveBatch(db, 'buque-afeto', { id: 'BA-001', quantity: 0, expiresAt: Core.offsetDate(5), editing: true });
  assert.equal(db.cart.length, 0);
});
test('exportar e reabrir o JSON preserva os pedidos e os saldos', () => {
  const db = fresh();
  Core.setCartQuantity(db, 'rosa', 3, now);
  Core.checkout(db, 'Cliente exemplo', now);
  const reopened = JSON.parse(JSON.stringify(db));
  assert.ok(Core.validateDatabase(reopened));
  assert.equal(Core.stock(reopened.products[0], now), 27);
  assert.equal(reopened.orders[0].total, 3600);
});
test('dados locais inválidos são identificados antes de renderizar a tela', () => {
  assert.equal(Core.validateDatabase(null), false);
  assert.equal(Core.validateDatabase({ schemaVersion: 1 }), false);
  const db = fresh();
  db.products[0].batches[0].quantity = -1;
  assert.equal(Core.validateDatabase(db), false);
});
