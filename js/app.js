(function () {
  'use strict';
  const Core = window.FlorCore;
  const STORAGE_KEY = 'flor-da-estacao:v1';
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const money = (cents) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const normalize = (text) => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const dateLabel = (date) => date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sem validade';
  const dateTime = (date) => new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const categories = [{ id: 'all', label: 'Todos', icon: 'grid' }, { id: 'flores', label: 'Flores', icon: 'flower' }, { id: 'buques', label: 'Buquês', icon: 'bouquet' }, { id: 'arranjos', label: 'Arranjos', icon: 'vase' }, { id: 'plantas', label: 'Plantas', icon: 'sprout' }, { id: 'presentes', label: 'Presentes', icon: 'gift' }, { id: 'decoracao', label: 'Decoração', icon: 'sun' }];
  const paths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    box: '<path d="m3 7 9-4 9 4v10l-9 4-9-4Z"/><path d="m3 7 9 5 9-5M12 12v9M7.5 5 17 10v4"/>',
    receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2Z"/><path d="M9 7h6m-6 4h6m-6 4h3"/>',
    sprout: '<path d="M12 21v-9M12 16C3 17 2 10 3 6c8-1 10 3 9 10Zm0-5c-1-6 4-9 9-8 1 6-3 10-9 8Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 3m0 3h.01"/>',
    store: '<path d="m3 9 2-6h14l2 6M3 9c0 4 4 4 4 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 4 4 4 0M5 12v9h14v-9M9 21v-6h6v6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    'arrow-up-right': '<path d="M6 18 18 6M7 6h11v11"/>',
    sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Zm8-2v4m-2-2h4"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    sliders: '<path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    flower: '<path d="M12 7c-7-8-13 2-5 5-8 7 2 13 5 5 7 8 13-2 5-5 8-7-2-13-5-5Z"/><circle cx="12" cy="12" r="2.5"/>',
    bouquet: '<path d="m7 12 3 9h4l3-9M8 15h8M12 11v4M7 3c-5 0-5 7 0 7s5-7 0-7Zm10 0c-5 0-5 7 0 7s5-7 0-7ZM8 10l2 5m6-5-2 5"/>',
    vase: '<path d="M8 11h8l-1 4c5 6 3 7-3 7s-8-1-3-7Zm4 0V3m0 5c-5 0-6-3-6-5 5 0 6 2 6 5Zm0-2c0-3 3-5 6-5 0 4-2 5-6 5Z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13m0-13c-8 0-8-8-3-6 2 1 3 6 3 6Zm0 0c8 0 8-8 3-6-2 1-3 6-3 6Z"/>',
    'shopping-bag': '<path d="M5 7h14l1 14H4Zm3 0V6a4 4 0 0 1 8 0v1M8 10v1m8-1v1"/>',
    user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="m6 6 12 12M6 18 18 6"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    'shield-check': '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    warning: '<path d="m12 3 10 18H2ZM12 9v5m0 3h.01"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    edit: '<path d="m15 4 5 5-11 11H4v-5ZM13 6l5 5"/>',
    heart: '<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 3 12 8 16 5-4 13-11 8-16Z"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>'
  };
  const icon = (name) => `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.flower}</svg></span>`;
  document.querySelectorAll('[data-icon]').forEach((element) => { element.innerHTML = icon(element.dataset.icon); });
  let storageAvailable = true;
  let storageNotice = '';
  let db;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    db = stored ? JSON.parse(stored) : Core.createDatabase(window.FLOR_SEED);
    if (!Core.validateDatabase(db)) throw new Error('invalid');
  } catch (error) {
    db = Core.createDatabase(window.FLOR_SEED);
    storageNotice = error.message === 'invalid' || error instanceof SyntaxError ? 'Os dados locais estavam inválidos. Carregamos os exemplos originais.' : 'O armazenamento está indisponível. Os dados serão mantidos apenas enquanto esta página estiver aberta.';
    storageAvailable = error.message === 'invalid' || error instanceof SyntaxError;
  }
  let category = 'all';
  let onlyAvailable = false;
  let activeView = 'catalogo';
  let toastTimer;
  let stockModalContext = null;
  let cartReturnFocus = null;
  const modal = $('#modal');

  function persist() {
    if (!storageAvailable) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
    catch {
      storageAvailable = false;
      toast('Não foi possível salvar no navegador. Exporte o JSON para guardar seus dados.', true);
    }
  }
  function toast(message, error = false) {
    clearTimeout(toastTimer);
    $('#toast-container').innerHTML = `<div class="toast${error ? ' error' : ''}">${icon(error ? 'warning' : 'check')}<span>${esc(message)}</span></div>`;
    toastTimer = setTimeout(() => { $('#toast-container').innerHTML = ''; }, error ? 6500 : 3200);
  }
  function emptyState(title, text, iconName = 'flower', action = '') {
    return `<div class="empty-state">${icon(iconName)}<h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;
  }
  function renderCategories() {
    $('#category-filters').innerHTML = categories.map((entry) => `<button class="category-button${category === entry.id ? ' active' : ''}" data-category="${entry.id}" aria-pressed="${category === entry.id}">${icon(entry.icon)}${entry.label}</button>`).join('');
  }
  function renderCatalog() {
    const search = normalize($('#catalog-search').value);
    const products = db.products.filter((product) => (category === 'all' || product.category === category) && (!onlyAvailable || Core.stock(product) > 0) && normalize(product.name + ' ' + product.description).includes(search));
    $('#catalog-count').textContent = products.length;
    $('#catalog-grid').innerHTML = products.length ? products.map((product) => {
      const stock = Core.stock(product);
      const reserved = db.cart.find((item) => item.productId === product.id)?.quantity || 0;
      const remaining = stock - reserved;
      return `<article class="product-card${!stock ? ' sold-out' : ''}" data-product="${esc(product.id)}"><div class="product-photo"><img src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy" width="400" height="300"><span class="product-tag">${esc(product.tag)}</span></div><div class="product-details"><div class="product-meta"><span>${esc(categories.find((entry) => entry.id === product.category)?.label || 'Produto')}</span><span class="stock-label${!stock ? ' out' : stock <= 5 ? ' low' : ''}">${stock ? `${stock} disponíveis` : 'Indisponível'}</span></div><h3>${esc(product.name)}</h3><p class="product-description">${esc(product.description)}</p><div class="product-bottom"><span class="product-price">${money(product.price)} <span class="product-unit">/ ${esc(product.unit)}</span></span><button class="add-button" data-add="${esc(product.id)}" aria-label="Adicionar ${esc(product.name)}" ${remaining <= 0 ? 'disabled' : ''}>${icon('plus')}${!stock ? 'Esgotado' : remaining <= 0 ? 'No pedido' : 'Adicionar'}</button></div></div></article>`;
    }).join('') : emptyState('Nenhuma flor por aqui', 'Tente outro nome ou escolha uma categoria diferente.', 'search', '<button class="button secondary" id="reset-filters">Limpar filtros</button>');
  }
  const emptyCartArt = '<svg class="cart-empty-illustration" viewBox="0 0 160 170" fill="none" aria-hidden="true"><ellipse cx="80" cy="154" rx="51" ry="7" fill="#f1f2e9"/><path d="M62 96h36l-4 18c20 30 13 39-14 39s-34-9-14-39Z" fill="#f5f3e9" stroke="#c9ceba" stroke-width="1.2"/><ellipse cx="80" cy="96" rx="18" ry="4" stroke="#c9ceba" stroke-width="1.2"/><path d="M80 94V47m0 35C58 82 55 63 59 57c17 1 24 13 21 25Zm0-13c-3-21 12-29 23-28 4 19-5 31-23 28Z" fill="#e5eadb" stroke="#b3bea3" stroke-width="1.2"/><path d="M79 42c-18-20-34 6-12 13-20 18 6 34 13 12 18 20 34-6 12-13 20-18-6-34-13-12Z" fill="#f1e7d5" stroke="#c5c5a5" stroke-width="1.2"/><circle cx="80" cy="55" r="7" fill="#dfd8b8" stroke="#c5c5a5"/><path d="m33 97 3-6 3 6-3 6Zm89 23 2-4 2 4-2 4ZM119 33l3-6 3 6-3 6Z" fill="#d9dfca"/><path d="M48 130h5m-2.5-2.5v5M105 85h5m-2.5-2.5v5" stroke="#d2dbc2" stroke-linecap="round"/></svg>';
  function renderCart() {
    const count = db.cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = money(Core.cartTotal(db));
    $('#cart-count').textContent = count;
    $('#mobile-cart-count').textContent = `(${count})`;
    $('#cart-subtotal').textContent = total;
    $('#cart-total').textContent = total;
    $('#mobile-cart-total').textContent = total;
    $('#checkout-button').disabled = !count;
    $('#clear-cart').hidden = !count;
    const orderNumber = $('#cart-order-number');
    if (orderNumber) {
      orderNumber.textContent = count ? `Pedido #${db.lastOrderNumber + 1} · Feito com carinho` : 'Um carinho começa por aqui.';
    }
    $('#cart-items').innerHTML = count ? db.cart.map((item) => {
      const product = db.products.find((entry) => entry.id === item.productId);
      return `<article class="cart-item"><img src="${esc(product.image)}" alt="" width="54" height="63"><div class="cart-item-content"><div class="cart-item-name"><h3>${esc(product.name)}</h3><button class="remove-item" data-remove="${esc(product.id)}" aria-label="Remover ${esc(product.name)}">${icon('x')}</button></div><p class="cart-item-unit">${money(product.price)} / ${esc(product.unit)}</p><div class="cart-item-controls"><div class="quantity-control"><button data-quantity="${esc(product.id)}" data-delta="-1" aria-label="Diminuir quantidade de ${esc(product.name)}">${icon('minus')}</button><span aria-label="Quantidade">${item.quantity}</span><button data-quantity="${esc(product.id)}" data-delta="1" aria-label="Aumentar quantidade de ${esc(product.name)}" ${item.quantity >= Core.stock(product) ? 'disabled' : ''}>${icon('plus')}</button></div><strong class="line-total">${money(product.price * item.quantity)}</strong></div></div></article>`;
    }).join('') : `<div class="cart-empty">${emptyCartArt}<h3>Seu pedido está<br>esperando florescer.</h3><p>Adicione produtos do catálogo<br>e crie um momento especial.</p><span class="little-flower" aria-hidden="true">✳</span></div>`;
  }
  function stockSituation(product) {
    const quantity = Core.stock(product);
    const expiry = Core.nextExpiry(product);
    if (!quantity) return { label: 'Sem estoque', color: 'neutral' };
    if (Core.expiredStock(product)) return { label: 'Lote vencido', color: 'rose' };
    if (expiry && Core.daysUntil(expiry) <= 3) return { label: 'Vence em breve', color: 'amber' };
    if (quantity <= 5) return { label: 'Estoque baixo', color: 'amber' };
    return { label: 'Em dia', color: '' };
  }
  function expiryDescription(date) {
    const days = Core.daysUntil(date);
    if (days === null) return 'Produto sem prazo de validade';
    return days < 0 ? `Vencido há ${Math.abs(days)} dia(s)` : days === 0 ? 'Vence hoje' : days === 1 ? 'Vence amanhã' : `Vence em ${days} dias`;
  }
  function statsCard(label, value, description, iconName, tone = '') {
    return `<div class="stat-card"><span class="stat-icon ${tone}">${icon(iconName)}</span><div><p>${label}</p><strong>${value}</strong><small>${description}</small></div></div>`;
  }
  function renderStock() {
    const units = db.products.reduce((sum, product) => sum + Core.stock(product), 0);
    const soon = db.products.flatMap((product) => product.batches).filter((batch) => Core.isAvailable(batch) && batch.expiresAt && Core.daysUntil(batch.expiresAt) <= 3).length;
    const expired = db.products.reduce((sum, product) => sum + Core.expiredStock(product), 0);
    $('#stock-nav-count').textContent = soon + (expired > 0 ? 1 : 0) || '';
    $('#stock-stats').innerHTML = statsCard('Unidades disponíveis', units, `${db.products.length} produtos no catálogo`, 'box') + statsCard('Lotes vencendo', soon, 'Validade em até 3 dias', 'clock', 'amber') + statsCard('Unidades vencidas', expired, 'Bloqueadas para venda', 'warning', 'rose');
    const filter = $('#stock-filter').value;
    const query = normalize($('#stock-search').value);
    const products = db.products.filter((product) => {
      if (!normalize(product.name + ' ' + product.batches.map((batch) => batch.id).join(' ')).includes(query)) return false;
      const quantity = Core.stock(product);
      const expiry = Core.nextExpiry(product);
      return filter === 'all' || (filter === 'low' && quantity > 0 && quantity <= 5) || (filter === 'soon' && expiry && Core.daysUntil(expiry) <= 3) || (filter === 'expired' && Core.expiredStock(product) > 0) || (filter === 'out' && !quantity);
    });
    $('#stock-table-body').innerHTML = products.length ? products.map((product) => {
      const situation = stockSituation(product);
      const expiry = Core.nextExpiry(product);
      return `<tr><td><div class="table-product"><img src="${esc(product.image)}" alt="" loading="lazy"><div><strong>${esc(product.name)}</strong><small>${product.batches.length} lote(s) · ${esc(product.unit)}</small></div></div></td><td><span class="stock-quantity">${Core.stock(product)}</span><small class="stock-expiry">${Core.expiredStock(product) ? `${Core.expiredStock(product)} vencida(s)` : 'unidades'}</small></td><td>${expiry ? dateLabel(expiry) : product.perishable ? 'Sem lote disponível' : 'Sem validade'}<small class="stock-expiry">${expiry ? expiryDescription(expiry) : product.perishable ? 'Confira os lotes' : 'Não perecível'}</small></td><td><span class="status ${situation.color}">${situation.label}</span></td><td><button class="text-button" data-lots="${esc(product.id)}" aria-label="Ver lotes de ${esc(product.name)}">Ver lotes ${icon('arrow-up-right')}</button></td></tr>`;
    }).join('') : '<tr><td colspan="5">' + emptyState('Nenhum produto encontrado', 'Tente outro nome ou situação.', 'search') + '</td></tr>';
    $('#stock-table-count').textContent = `${products.length} de ${db.products.length} produtos`;
  }
  function renderOrders() {
    const today = Core.dateKey();
    const todayOrders = db.orders.filter((order) => Core.dateKey(new Date(order.createdAt)) === today);
    const sales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    $('#order-stats').innerHTML = statsCard('Pedidos de hoje', todayOrders.length, 'Momentos especiais', 'receipt') + statsCard('Total de hoje', money(sales), 'Pedidos finalizados', 'shopping-bag') + statsCard('Pedidos registrados', db.orders.length, 'Neste navegador', 'heart', 'rose');
    const query = normalize($('#order-search').value).replace(/^#/, '');
    const orders = db.orders.filter((order) => normalize(order.id + ' ' + order.customerName).includes(query));
    $('#orders-list').innerHTML = orders.length ? orders.map((order) => `<article class="order-row"><div class="order-row-left"><span class="order-bag">${icon('shopping-bag')}</span><div><h3>Pedido #${order.id} · ${esc(order.customerName || 'Cliente do balcão')}</h3><p>${dateTime(order.createdAt)} · ${order.items.reduce((sum, item) => sum + item.quantity, 0)} item(ns)</p></div></div><div class="order-row-right"><span class="status">Finalizado</span><strong>${money(order.total)}</strong><button class="text-button" data-order="${order.id}" aria-label="Ver pedido ${order.id}">Ver pedido ${icon('arrow-up-right')}</button></div></article>`).join('') : emptyState(query ? 'Nenhum pedido encontrado' : 'As boas histórias começam aqui', query ? 'Busque por outro número ou cliente.' : 'Finalize seu primeiro pedido e ele aparecerá neste espaço.', 'shopping-bag', query ? '' : '<button class="button secondary" data-catalog>Ir para o catálogo ' + icon('arrow-right') + '</button>');
  }
  function renderAll() { renderCatalog(); renderCart(); renderStock(); renderOrders(); }
  function changeCart(productId, quantity, message) {
    try {
      const previousFocus = document.activeElement;
      const fromCart = $('#cart-panel').contains(previousFocus);
      const fromCatalog = previousFocus.hasAttribute('data-add');
      Core.setCartQuantity(db, productId, quantity);
      persist(); renderCatalog(); renderCart();
      if (fromCart) {
        const control = Array.from(document.querySelectorAll('[data-quantity]')).find((button) => button.dataset.quantity === productId && !button.disabled);
        (control || $('#customer-name')).focus();
      } else if (fromCatalog) {
        const button = Array.from(document.querySelectorAll('[data-add]')).find((entry) => entry.dataset.add === productId && !entry.disabled);
        if (button) button.focus();
        else (matchMedia('(max-width:800px)').matches ? $('#mobile-cart-button') : $('#checkout-button')).focus();
      }
      if (message) toast(message);
    } catch (error) { toast(error.message, true); }
  }
  function switchView() {
    const requested = location.hash.slice(1);
    activeView = ['catalogo', 'estoque', 'pedidos'].includes(requested) ? requested : 'catalogo';
    document.querySelectorAll('.view').forEach((section) => { section.hidden = section.id !== activeView + '-view'; });
    document.querySelectorAll('[data-view]').forEach((link) => {
      const current = link.dataset.view === activeView;
      link.classList.toggle('active', current);
      if (current) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    document.title = `Flor da Estação | ${activeView === 'catalogo' ? 'Catálogo' : activeView === 'estoque' ? 'Estoque' : 'Pedidos'}`;
    window.scrollTo(0, 0);
    renderAll();
  }
  function openCart() {
    cartReturnFocus = document.activeElement;
    $('#cart-panel').classList.add('is-open');
    $('#cart-panel').setAttribute('role', 'dialog');
    $('#cart-panel').setAttribute('aria-modal', 'true');
    $('#cart-overlay').hidden = false;
    $('.workspace main').inert = true;
    $('.sidebar').inert = true;
    $('.topbar').inert = true;
    $('#mobile-cart-button').inert = true;
    document.body.style.overflow = 'hidden';
    $('#close-cart').focus();
  }
  function closeCart() {
    $('#cart-panel').classList.remove('is-open');
    $('#cart-panel').removeAttribute('role');
    $('#cart-panel').removeAttribute('aria-modal');
    $('#cart-overlay').hidden = true;
    document.querySelectorAll('[inert]').forEach((element) => { element.inert = false; });
    document.body.style.overflow = '';
    if (cartReturnFocus) { cartReturnFocus.focus(); cartReturnFocus = null; }
  }
  function showModal(content) {
    $('#modal-content').innerHTML = content;
    if (!modal.open) modal.showModal();
    else modal.querySelector('button, input, select')?.focus();
  }
  function modalHeader(title, description) {
    return `<div class="modal-header"><div><h2 id="modal-title">${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ''}</div><button class="icon-button" data-close-modal aria-label="Fechar janela">${icon('x')}</button></div>`;
  }
  function showOrder(order) {
    showModal(modalHeader('Pedido #' + order.id, `${order.customerName || 'Cliente do balcão'} · ${dateTime(order.createdAt)}`) + `<div class="modal-body"><span class="status">Finalizado</span>${order.items.map((item) => `<div class="order-detail-line"><span>${item.quantity} × ${esc(item.name)}<small>${money(item.unitPrice)} por unidade</small></span><strong>${money(item.unitPrice * item.quantity)}</strong></div>`).join('')}<div class="cart-total-row"><span>Total do pedido</span><strong>${money(order.total)}</strong></div></div><div class="modal-footer"><button class="button primary" data-close-modal>Tudo certo ${icon('check')}</button></div>`);
  }
  function checkout() {
    try {
      const order = Core.checkout(db, $('#customer-name').value);
      $('#customer-name').value = '';
      persist(); renderAll(); closeCart();
      showModal(`<div class="modal-success"><span class="success-icon">${icon('check')}</span><h2 id="modal-title">Mais um momento<br>que floresceu!</h2><p>Pedido <strong>#${order.id}</strong> finalizado${order.customerName ? ` para ${esc(order.customerName)}` : ''}.<br>O estoque já foi atualizado com carinho.</p><strong class="success-total">${money(order.total)}</strong><div class="success-meta"><p>${order.items.reduce((sum, item) => sum + item.quantity, 0)} item(ns) · ${dateTime(order.createdAt)}</p></div></div><div class="modal-footer"><button class="button secondary" data-order="${order.id}">Ver pedido</button><button class="button primary" id="success-new-order">Novo pedido ${icon('arrow-right')}</button></div>`);
    } catch (error) { toast(error.message, true); renderAll(); }
  }
  function showLots(productId) {
    const product = db.products.find((entry) => entry.id === productId);
    if (!product) return;
    showModal(modalHeader(product.name, `${Core.stock(product)} unidade(s) disponível(is) · Lotes vencidos ficam bloqueados para venda.`) + `<div class="modal-body">${product.batches.map((batch) => {
      const days = Core.daysUntil(batch.expiresAt);
      return `<div class="lot-card"><div class="lot-heading"><strong>Lote ${esc(batch.id)}</strong><span class="status ${batch.quantity === 0 ? 'neutral' : days !== null && days < 0 ? 'rose' : days !== null && days <= 3 ? 'amber' : ''}">${!batch.quantity ? 'Esgotado' : days !== null && days < 0 ? 'Vencido' : days !== null && days <= 3 ? 'Vence em breve' : 'Em dia'}</span></div><div class="lot-details"><p>${batch.quantity} unidade(s)<br><small>${batch.expiresAt ? dateLabel(batch.expiresAt) + ' · ' + expiryDescription(batch.expiresAt) : 'Sem prazo de validade'}</small></p><button class="text-button" data-edit-batch="${esc(batch.id)}" data-product-id="${esc(product.id)}">${icon('edit')} Ajustar</button></div></div>`;
    }).join('')}</div><div class="modal-footer"><button class="button secondary" data-close-modal>Fechar</button><button class="button primary" data-new-batch="${esc(productId)}">${icon('plus')} Novo lote</button></div>`);
  }
  function showStockForm(productId = '', batchId = '') {
    const product = db.products.find((entry) => entry.id === productId) || db.products[0];
    const batch = batchId ? product.batches.find((entry) => entry.id === batchId) : null;
    stockModalContext = { productId: product.id, batchId: batch ? batch.id : null };
    showModal(modalHeader(batch ? 'Ajustar lote' : 'Deixe o estoque florescer', batch ? 'A quantidade informada substitui o saldo atual deste lote.' : 'Registre a chegada de um novo lote ao ateliê.') + `<form id="stock-form"><div class="modal-body"><p class="form-error" id="stock-form-error" role="alert"></p><div class="form-group"><label for="stock-product">Produto</label><select id="stock-product" name="product" ${batch ? 'disabled' : ''}>${db.products.map((entry) => `<option value="${esc(entry.id)}" ${entry.id === product.id ? 'selected' : ''}>${esc(entry.name)}</option>`).join('')}</select></div><div class="form-group"><label for="stock-batch">Código do lote</label><input id="stock-batch" name="batch" maxlength="32" required placeholder="Ex.: RO-003" value="${batch ? esc(batch.id) : ''}" ${batch ? 'readonly' : ''}></div><div class="form-row"><div class="form-group"><label for="stock-quantity">Quantidade em unidades</label><input id="stock-quantity" name="quantity" type="number" min="0" max="9999" step="1" required value="${batch ? batch.quantity : ''}" placeholder="0" inputmode="numeric"></div><div class="form-group"><label for="stock-expiration">Data de validade</label><input id="stock-expiration" name="expiration" type="date" value="${batch?.expiresAt || ''}" ${product.perishable ? 'required' : ''}><small id="expiration-hint">${product.perishable ? 'Obrigatória para flores e produtos perecíveis.' : 'Opcional para produtos não perecíveis.'}</small></div></div><p class="form-hint">${batch ? 'Se o novo saldo for menor que o pedido atual, a quantidade no carrinho será ajustada.' : 'Um lote vencido será registrado, mas ficará indisponível para venda.'}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close-modal>Cancelar</button><button class="button primary" type="submit">${icon('check')} Salvar ${batch ? 'ajuste' : 'lote'}</button></div></form>`);
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `flor-da-estacao-${Core.dateKey()}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('JSON com produtos, estoque e pedidos exportado.');
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, [data-go-stock]');
    if (!target) return;
    if (target.dataset.category) { category = target.dataset.category; renderCategories(); renderCatalog(); Array.from(document.querySelectorAll('[data-category]')).find((button) => button.dataset.category === category)?.focus(); }
    if (target.dataset.add) {
      const product = db.products.find((entry) => entry.id === target.dataset.add);
      const quantity = db.cart.find((entry) => entry.productId === product.id)?.quantity || 0;
      changeCart(product.id, quantity + 1, product.name + ' adicionado ao pedido.');
    }
    if (target.dataset.remove) changeCart(target.dataset.remove, 0, 'Produto removido do pedido.');
    if (target.dataset.quantity) {
      const item = db.cart.find((entry) => entry.productId === target.dataset.quantity);
      if (item) {
        const productId = item.productId;
        const delta = target.dataset.delta;
        changeCart(productId, item.quantity + Number(delta));
        const nextButton = Array.from(document.querySelectorAll('[data-quantity]')).find((button) => button.dataset.quantity === productId && button.dataset.delta === delta && !button.disabled);
        if (nextButton) nextButton.focus();
      }
    }
    if (target.hasAttribute('data-go-stock')) location.hash = 'estoque';
    if (target.hasAttribute('data-catalog')) location.hash = 'catalogo';
    if (target.dataset.lots) showLots(target.dataset.lots);
    if (target.dataset.newBatch) showStockForm(target.dataset.newBatch);
    if (target.dataset.editBatch) showStockForm(target.dataset.productId, target.dataset.editBatch);
    if (target.dataset.order) { const order = db.orders.find((entry) => entry.id === Number(target.dataset.order)); if (order) showOrder(order); }
    if (target.hasAttribute('data-close-modal')) modal.close();
    if (target.id === 'success-new-order') { modal.close(); location.hash = 'catalogo'; $('#catalog-search').focus(); }
    if (target.id === 'reset-filters') { category = 'all'; onlyAvailable = false; $('#available-filter').setAttribute('aria-pressed', 'false'); $('#catalog-search').value = ''; renderCategories(); renderCatalog(); }
  });
  $('#catalog-search').addEventListener('input', renderCatalog);
  $('#stock-search').addEventListener('input', renderStock);
  $('#stock-filter').addEventListener('change', renderStock);
  $('#order-search').addEventListener('input', renderOrders);
  $('#available-filter').addEventListener('click', () => { onlyAvailable = !onlyAvailable; $('#available-filter').setAttribute('aria-pressed', String(onlyAvailable)); renderCatalog(); toast(onlyAvailable ? 'Mostrando somente produtos disponíveis.' : 'Mostrando todos os produtos.'); });
  $('#customer-name').value = db.customerName || '';
  $('#customer-name').addEventListener('input', () => { db.customerName = $('#customer-name').value; persist(); });
  $('#checkout-button').addEventListener('click', checkout);
  $('#clear-cart').addEventListener('click', () => showModal(modalHeader('Limpar este pedido?', 'Os produtos serão removidos do pedido atual. O estoque permanece disponível.') + '<div class="modal-footer"><button class="button secondary" data-close-modal>Continuar pedido</button><button class="button danger" id="confirm-clear">Limpar pedido</button></div>'));
  modal.addEventListener('click', (event) => {
    if (event.target.closest('#confirm-clear')) { db.cart = []; db.customerName = ''; $('#customer-name').value = ''; persist(); renderAll(); modal.close(); toast('Tudo pronto para um novo pedido.'); }
    if (event.target === modal) { const rect = modal.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close(); }
  });
  modal.addEventListener('change', (event) => {
    if (event.target.id !== 'stock-product') return;
    const product = db.products.find((entry) => entry.id === event.target.value);
    $('#stock-expiration').required = product.perishable;
    $('#expiration-hint').textContent = product.perishable ? 'Obrigatória para flores e produtos perecíveis.' : 'Opcional para produtos não perecíveis.';
  });
  modal.addEventListener('submit', (event) => {
    if (event.target.id !== 'stock-form') return;
    event.preventDefault();
    try {
      Core.saveBatch(db, $('#stock-product').value, { id: $('#stock-batch').value, quantity: Number($('#stock-quantity').value), expiresAt: $('#stock-expiration').value, editing: !!stockModalContext.batchId });
      persist(); renderAll(); modal.close(); toast('Estoque atualizado. Tudo pronto para florescer!');
    } catch (error) { $('#stock-form-error').textContent = error.message; }
  });
  $('#new-stock-button').addEventListener('click', () => showStockForm());
  $('#new-order-button').addEventListener('click', () => { location.hash = 'catalogo'; });
  $('#mobile-cart-button').addEventListener('click', openCart);
  $('#close-cart').addEventListener('click', closeCart);
  $('#cart-overlay').addEventListener('click', closeCart);
  $('#export-button').addEventListener('click', exportData);
  $('#help-button').addEventListener('click', () => showModal(modalHeader('Feito para o seu ateliê', 'Sempre a flor certa para o momento.') + `<div class="modal-body"><p>Um espaço para cuidar das flores e dos pequenos gestos do seu balcão.</p><div class="about-list"><div>${icon('shopping-bag')}<div><strong>Do catálogo para o pedido</strong><p>Adicione produtos, ajuste quantidades e finalize. O estoque é atualizado automaticamente.</p></div></div><div>${icon('clock')}<div><strong>Cuidado com cada lote</strong><p>Acompanhe quantidades e validades. Lotes vencidos ficam bloqueados e os mais próximos da validade saem primeiro.</p></div></div><div>${icon('database')}<div><strong>Seus dados, neste navegador</strong><p>Esta é uma demonstração com dados fictícios em JSON, salvos no armazenamento local. Você pode exportar o JSON na aba Estoque. Não há pagamento ou conexão com banco de dados.</p></div></div></div></div><div class="modal-footer"><button class="button primary" data-close-modal>Vamos florescer ${icon('flower')}</button></div>`));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.open && $('#cart-panel').classList.contains('is-open')) closeCart();
    if (event.key === '/' && !modal.open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !$('#cart-panel').classList.contains('is-open')) { event.preventDefault(); $(activeView === 'catalogo' ? '#catalog-search' : activeView === 'estoque' ? '#stock-search' : '#order-search').focus(); }
    if (event.key === 'Tab' && $('#cart-panel').classList.contains('is-open') && !modal.open) {
      const controls = Array.from($('#cart-panel').querySelectorAll('button:not(:disabled):not([hidden]), input')).filter((element) => element.getClientRects().length);
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('hashchange', switchView);
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const updated = JSON.parse(event.newValue);
      if (!Core.validateDatabase(updated)) return;
      db = updated; $('#customer-name').value = db.customerName;
      if (modal.open) modal.close();
      renderAll(); toast('Dados atualizados por outra aba deste navegador.');
    } catch { /* Uma escrita incompleta não substitui os dados válidos em memória. */ }
  });
  matchMedia('(min-width: 801px)').addEventListener('change', (event) => { if (event.matches) closeCart(); });
  let lastDate = Core.dateKey();
  function refreshDate() {
    $('#today').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (Core.dateKey() !== lastDate) { lastDate = Core.dateKey(); renderAll(); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); });
  setInterval(refreshDate, 60000);
  refreshDate(); renderCategories(); switchView(); persist();
  if (storageNotice) toast(storageNotice, true);
})();
