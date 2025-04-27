/*
 * <view-transition>
 * <div view-transition-name="nombre_de_tu_transicion"></div>
 * </view-transition>
 * */

// view-transition.js

class ViewTransitionElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<slot></slot>`;
  }

  connectedCallback() {
    // Find the child with either view-transition-name or data-transition-*
    const candidate = Array.from(this.querySelectorAll('*'))
      .map(el => {
        const viewName = el.style.viewTransitionName || el.getAttribute('view-transition-name');
        const dataAttr = Array.from(el.attributes).find(attr => attr.name.startsWith('data-transition-'));
        return { el, viewName, dataAttr };
      })
      .find(({ viewName, dataAttr }) => viewName || dataAttr);

    if (!candidate) {
      console.warn('[ViewTransition] No transition target found inside <view-transition>');
      return;
    }

    this.target = candidate.el;

    if (candidate.viewName) {
      this.transitionName = candidate.viewName;
    } else if (candidate.dataAttr) {
      this.transitionName = candidate.dataAttr.name.replace('data-transition-', '');
      this.target.removeAttribute(candidate.dataAttr.name);
      this.target.style.viewTransitionName = this.transitionName;
    }
  }
}

customElements.define('view-transition', ViewTransitionElement);

