// Pequenas melhorias de navegação; o menu Bootstrap funciona sem este arquivo.
document.addEventListener('DOMContentLoaded', () => {
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const menu = document.querySelector('#menu');
  if (menu && window.bootstrap) {
    menu.querySelectorAll('a.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992) bootstrap.Collapse.getOrCreateInstance(menu).hide();
      });
    });
  }
});
