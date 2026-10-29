(function (root) {
  'use strict';
  const DAY = 86400000;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const validQuantity = (value) => Number.isInteger(value) && value >= 0 && value <= 9999;
  const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T12:00:00')) && new Date(value + 'T12:00:00').getDate() === Number(value.slice(-2));

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function offsetDate(days, now = new Date()) {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return dateKey(date);
  }
  function daysUntil(date, now = new Date()) {
    if (!date) return null;
    return Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(dateKey(now) + 'T00:00:00Z')) / DAY);
  }
  function createDatabase(seed, now = new Date()) {
    const db = clone(seed);
    db.createdAt = now.toISOString();
    db.customerName = '';
    db.products.forEach((product) => product.batches.forEach((batch) => {
      batch.receivedAt = dateKey(now);
      batch.expiresAt = Number.isFinite(batch.expiresInDays) ? offsetDate(batch.expiresInDays, now) : null;
      delete batch.expiresInDays;
    }));
    return db;
  }
  function isAvailable(batch, now = new Date()) {
    return batch.quantity > 0 && (!batch.expiresAt || batch.expiresAt >= dateKey(now));
  }
  function stock(product, now = new Date()) {
    return product.batches.reduce((total, batch) => total + (isAvailable(batch, now) ? batch.quantity : 0), 0);
  }
  function expiredStock(product, now = new Date()) {
    return product.batches.reduce((total, batch) => total + (batch.expiresAt && batch.expiresAt < dateKey(now) ? batch.quantity : 0), 0);
  }
  function nextExpiry(product, now = new Date()) {
    return product.batches.filter((batch) => isAvailable(batch, now) && batch.expiresAt).map((batch) => batch.expiresAt).sort()[0] || null;
  }
  function setCartQuantity(db, productId, quantity, now = new Date()) {
    if (!validQuantity(quantity)) throw new Error('Informe uma quantidade inteira entre 0 e 9.999.');
    const product = db.products.find((item) => item.id === productId);
    if (!product) throw new Error('Produto não encontrado.');
    if (quantity > stock(product, now)) throw new Error(`Temos apenas ${stock(product, now)} unidade(s) de ${product.name} disponíveis.`);
    const existing = db.cart.find((item) => item.productId === productId);
    if (!quantity) db.cart = db.cart.filter((item) => item.productId !== productId);
    else if (existing) existing.quantity = quantity;
    else db.cart.push({ productId, quantity });
  }
  function cartTotal(db) {
    return db.cart.reduce((total, item) => total + db.products.find((product) => product.id === item.productId).price * item.quantity, 0);
  }
  function checkout(db, customerName = '', now = new Date()) {
    if (!db.cart.length) throw new Error('Adicione um produto para começar seu pedido.');
    // Trabalhar em uma cópia garante que uma falha não baixe parte do estoque.
    const next = clone(db);
    const items = next.cart.map((item) => {
      const product = next.products.find((entry) => entry.id === item.productId);
      if (!product || !validQuantity(item.quantity) || item.quantity === 0 || item.quantity > stock(product, now)) {
        throw new Error(`O estoque de ${product ? product.name : 'um produto'} mudou. Ajuste a quantidade no pedido.`);
      }
      let remaining = item.quantity;
      const allocations = [];
      const batches = product.batches.filter((batch) => isAvailable(batch, now)).sort((a, b) => (a.expiresAt || '9999').localeCompare(b.expiresAt || '9999'));
      for (const batch of batches) {
        if (!remaining) break;
        const quantity = Math.min(remaining, batch.quantity);
        batch.quantity -= quantity;
        remaining -= quantity;
        allocations.push({ batchId: batch.id, quantity });
      }
      return { productId: product.id, name: product.name, image: product.image, unitPrice: product.price, quantity: item.quantity, allocations };
    });
    const order = { id: ++next.lastOrderNumber, customerName: String(customerName).trim().slice(0, 80), createdAt: now.toISOString(), items, total: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0), status: 'completed' };
    next.orders.unshift(order);
    next.cart = [];
    next.customerName = '';
    Object.assign(db, next);
    return order;
  }
  function saveBatch(db, productId, batchInput) {
    const product = db.products.find((entry) => entry.id === productId);
    if (!product) throw new Error('Produto não encontrado.');
    const id = String(batchInput.id || '').trim();
    if (!id || id.length > 32) throw new Error('Informe um lote com até 32 caracteres.');
    if (!validQuantity(batchInput.quantity)) throw new Error('Informe uma quantidade inteira entre 0 e 9.999.');
    const expiresAt = batchInput.expiresAt || null;
    if ((product.perishable && !expiresAt) || (expiresAt && !validDate(expiresAt))) throw new Error('Informe uma data de validade válida para este lote.');
    const existing = product.batches.find((batch) => batch.id === id);
    if (existing && !batchInput.editing) throw new Error('Esse lote já existe. Edite o lote existente ou use outro código.');
    if (batchInput.editing && !existing) throw new Error('Lote não encontrado.');
    const batch = { id, quantity: batchInput.quantity, expiresAt, receivedAt: existing ? existing.receivedAt : dateKey() };
    if (existing) Object.assign(existing, batch);
    else product.batches.push(batch);
    // Ajustes manuais nunca deixam uma quantidade impossível reservada no carrinho.
    const cartItem = db.cart.find((item) => item.productId === productId);
    if (cartItem && cartItem.quantity > stock(product)) setCartQuantity(db, productId, stock(product));
    return batch;
  }
  function validateDatabase(db) {
    if (!db || db.schemaVersion !== 1 || !Array.isArray(db.products) || !db.products.length || !Array.isArray(db.cart) || !Array.isArray(db.orders) || !Number.isSafeInteger(db.lastOrderNumber) || db.lastOrderNumber < 1000 || typeof db.customerName !== 'string') return false;
    const ids = new Set();
    for (const product of db.products) {
      if (!product || typeof product.id !== 'string' || ids.has(product.id) || !['name', 'description', 'category', 'unit', 'image', 'tag'].every((key) => typeof product[key] === 'string') || typeof product.perishable !== 'boolean' || !Number.isSafeInteger(product.price) || product.price < 0 || !Array.isArray(product.batches)) return false;
      ids.add(product.id);
      const batches = new Set();
      for (const batch of product.batches) {
        if (!batch || typeof batch.id !== 'string' || batches.has(batch.id) || !validQuantity(batch.quantity) || !(batch.expiresAt === null || validDate(batch.expiresAt)) || (product.perishable && !batch.expiresAt)) return false;
        batches.add(batch.id);
      }
    }
    const cartIds = new Set();
    for (const item of db.cart) {
      if (!item || !ids.has(item.productId) || cartIds.has(item.productId) || !validQuantity(item.quantity) || !item.quantity) return false;
      cartIds.add(item.productId);
    }
    return db.orders.every((order) => order && Number.isSafeInteger(order.id) && typeof order.customerName === 'string' && !Number.isNaN(Date.parse(order.createdAt)) && Number.isSafeInteger(order.total) && Array.isArray(order.items) && order.items.length && order.items.every((item) => item && typeof item.name === 'string' && Number.isSafeInteger(item.unitPrice) && validQuantity(item.quantity) && item.quantity > 0));
  }
  const api = { dateKey, offsetDate, daysUntil, createDatabase, isAvailable, stock, expiredStock, nextExpiry, setCartQuantity, cartTotal, checkout, saveBatch, validateDatabase };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlorCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
