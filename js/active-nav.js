(function () {
  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var links = document.querySelectorAll('.nav a');
  for (var i = 0; i < links.length; i++) {
    var href = (links[i].getAttribute('href') || '').split(/[?#]/)[0];
    if (href.split('/').pop().toLowerCase() === file) {
      links[i].classList.add('active');
    }
  }
})();