(function () {
  var root = document.getElementById('toc');
  var tree = document.getElementById('toc-tree');
  if (!root || !tree || !window.__DOCFX_TOC) return;

  var base = window.__TOC_BASE || document.baseURI;
  var current = decodeURIComponent(location.pathname).replace(/\\/g, '/');
  if (current.length > 1 && current.charAt(current.length - 1) === '/') current += 'index.html';

  function resolve(href) {
    try { return decodeURIComponent(new URL(href, base).pathname).replace(/\\/g, '/'); }
    catch (e) { return null; }
  }

  function findChain(items) {
    for (var i = 0; i < items.length; i++) {
      var n = items[i];
      var h = n.href || n.topicHref;
      if (h && resolve(h) === current) return [n];
      if (n.items && n.items.length) {
        var r = findChain(n.items);
        if (r) return [n].concat(r);
      }
    }
    return null;
  }

  var chain = findChain(window.__DOCFX_TOC.items || []) || [];

  function render(items) {
    var ul = document.createElement('ul');
    for (var i = 0; i < items.length; i++) {
      var n = items[i];
      var hasKids = n.items && n.items.length > 0;
      var idx = chain.indexOf(n);
      var isActive = idx >= 0 && idx === chain.length - 1;
      var li = document.createElement('li');
      var cls = [];
      if (hasKids) cls.push('expander');
      if (idx >= 0) cls.push('expanded');
      if (isActive) cls.push('active');
      if (cls.length) li.className = cls.join(' ');
      if (hasKids) {
        var stub = document.createElement('span');
        stub.className = 'expand-stub';
        li.appendChild(stub);
      }
      var h = n.href || n.topicHref;
      var el;
      if (h) {
        el = document.createElement('a');
        el.className = isActive ? 'nav-link active' : 'nav-link';
        el.href = new URL(h, base).href;
      } else {
        el = document.createElement('span');
        el.className = 'name-only';
      }
      el.textContent = n.name;
      li.appendChild(el);
      if (hasKids) li.appendChild(render(n.items));
      ul.appendChild(li);
    }
    return ul;
  }

  tree.appendChild(render(window.__DOCFX_TOC.items || []));

  root.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== root && !(el.className && String(el.className).indexOf('expand-stub') >= 0)) {
      el = el.parentElement;
    }
    if (el && el !== root && el.parentElement) {
      el.parentElement.classList.toggle('expanded');
      e.preventDefault();
      e.stopPropagation();
    }
  });

  var input = document.getElementById('toc-filter');
  var filterOn = false;
  function eachLi(fn) { var lis = tree.querySelectorAll('li'); for (var i = 0; i < lis.length; i++) fn(lis[i]); }
  function restore() {
    eachLi(function (li) {
      li.style.display = '';
      if (li.hasAttribute('data-orig-expanded')) {
        li.classList.toggle('expanded', li.getAttribute('data-orig-expanded') === '1');
      }
    });
  }
  function mark(li, q) {
    var el = li.querySelector('a, .name-only');
    var self = q === '' || (el && el.textContent.toLowerCase().indexOf(q) >= 0);
    var ul = li.querySelector(':scope > ul');
    var childMatch = false;
    if (ul) {
      for (var i = 0; i < ul.children.length; i++) {
        if (mark(ul.children[i], q)) childMatch = true;
      }
    }
    var show = self || childMatch;
    li.style.display = show ? '' : 'none';
    if (q !== '' && childMatch) li.classList.add('expanded');
    return show;
  }
  if (input) {
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        if (filterOn) { restore(); filterOn = false; }
        return;
      }
      if (!filterOn) {
        eachLi(function (li) { li.setAttribute('data-orig-expanded', li.classList.contains('expanded') ? '1' : '0'); });
        filterOn = true;
      } else {
        restore();
      }
      var tops = tree.querySelectorAll(':scope > ul > li');
      for (var i = 0; i < tops.length; i++) mark(tops[i], q);
    });
  }
})();