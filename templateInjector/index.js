
/*
  * Wed Apr 30 11:44:39 PM CST 2025
  *
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
  constructor() {
    super();
  }

  connectedCallback() {
    this.inject();
  }

  async inject() {
    const templateId = this.getAttribute('injectTemplate');
    const templateFile = this.getAttribute('templateFile');


    if (!templateId) {
      console.error('[template-injector] ❌ Faltó el atributo injectTemplate.');
      return;
    }

    let template = document.getElementById(templateId);

    if (!template && templateFile) {
      try {
        template = await this.loadTemplateFromFile(templateFile, templateId);
      } catch (error) {
        console.error('[template-injector] ❌ Error cargando archivo de templates:', error);
        return;
      }
    }

    if (!template) {
      console.error(
        `[template-injector] ❌ No se encontró el template con id "${templateId}" después de todo.`
      );
      return;
    }

    const clone = template.content.cloneNode(true);
    this.replaceWith(clone);
  }

  async loadTemplateFromFile(filePath, wantedTemplateId) {

    if (document.querySelector(`[data-template-file="${filePath}"]`)) {
      return document.getElementById(wantedTemplateId);
    }

    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`❌ Falló el fetch del archivo: ${filePath}`);
    }

    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const wantedTemplate = doc.getElementById(wantedTemplateId);
    if (!wantedTemplate) {
      throw new Error(`❌ No se encontró template id="${wantedTemplateId}" en "${filePath}"`);
    }


    wantedTemplate.dataset.templateFile = filePath;
    document.body.appendChild(wantedTemplate);

    return wantedTemplate;
  }
}

customElements.define('template-injector', TemplateInjector);
