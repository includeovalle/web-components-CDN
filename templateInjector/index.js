
/*
  * Wed Apr 30 11:44:39 PM CST 2025
  * Dom 25 may 2025 20:25:29 CST
  * Este componente inserta un template de html en nuestro actual DOM
  *
  * @params:
  * injectTemplate: string => id que se buscara en el archivo de templates
  * templateFile: string => archivo .html que contiene los templates que se insertaran
  *
    <template-injector injectTemplate="nav__header" templateFile="./templates.html">
    </template-injector>
  */


class TemplateInjector extends HTMLElement {
  connectedCallback() {
    const templateId = this.getAttribute('injectTemplate');
    if (!templateId) return;

    const template = document.getElementById(templateId);
    if (!template) return;

    const clone = template.content.cloneNode(true);
    const children = Array.from(this.children);

    for (const el of children) {
      const slotName = el.getAttribute('slot');
      if (!slotName) continue;

      const target = clone.querySelector(`[data-inject-${slotName}]`);
      if (target) {
        target.replaceWith(el);
      }
    }

    this.appendChild(clone);
    this.removeAttribute('injectTemplate');
  }
}

customElements.define('template-injector', TemplateInjector);
