
/* Wed Apr 30 11:39:52 PM CST 2025
 * @params:
 *
 * view-transition-name: string => el nombre que se le asignara a la transicion en ambos archivos 
 *
 * <view-transition>
 * <div view-transition-name="nombre_de_tu_transicion"></div>
 * </view-transition>
 * */

// view-transition.js

class ViewTransition extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<slot></slot>`;
  }

  connectedCallback() {
    requestAnimationFrame(() => {
      const target =
        this.querySelector('[view-transition-name]') ||
        this.querySelector('[data-transition]');

      if (!target) {
        console.warn('[view-transition] No transition target found.');
        return;
      }

      // Generate view-transition-name from data-transition-foo
      if (!target.hasAttribute('view-transition-name')) {
        const dataAttr = [...target.attributes].find(attr =>
          attr.name.startsWith('data-transition-')
        );
        if (dataAttr) {
          const name = dataAttr.name.replace('data-transition-', '');
          target.setAttribute('view-transition-name', name);
        }
      }

      const name = target.getAttribute('view-transition-name');
      if (!name) return;

      // Inject dynamic styles
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`
        ::view-transition-old(${name}),
        ::view-transition-new(${name}) {
          animation: fade-${name} 0.4s ease;
        }

        @keyframes fade-${name} {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `);
      this.shadowRoot.adoptedStyleSheets = [sheet];

      // Optional: intercept <a> tag
      if (target instanceof HTMLAnchorElement) {
        target.addEventListener('click', e => {
          e.preventDefault();
          const href = target.getAttribute('href');
          if (href) {
            document.startViewTransition(() => {
              window.location.href = href;
            });
          }
        });
      }
    });
  }
}

customElements.define('view-transition', ViewTransition);
