/*
 * jue 08 may 2025 00:03:33 CST
 *
 * @params:
 * contans?: string => representa la palabra que se buscara en la url para resaltar el titulo
 *
 * USAGE
      <title-remark >
        <a contains="tablero" href="/tablero/index.html">Inicio</a>
      </title-remark >
 *
 <title-remark>
  <a href="/noticias">Noticias</a>
  <a href="/equipos" contains="equipos">Mis Equipos</a>
</title-remark>
 * */


class TitleRemark extends HTMLElement {
  constructor() {
    super();

    // Wait for children to be parsed
    requestAnimationFrame(() => {
      const children = [...this.children];
      const currentURL = window.location.href.toLowerCase();

      for (const el of children) {
        if (!(el instanceof HTMLElement)) continue;

        let keyword = (el.getAttribute('contains') || el.innerText || '').toLowerCase().trim();
        keyword = keyword.replace(/\s+/g, ' ');

        if (keyword && currentURL.includes(keyword)) {
          el.classList.add('matched');
        }
      }
    });
  }
}

customElements.define('title-remark', TitleRemark);
