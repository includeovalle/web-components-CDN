// async-tag-injector.js
//<async-tag type="p" endpoint="/api/user" searchAttribute="user"> default value </async-tag>

const templates = {
  span: document.createElement('template'),
  h1: document.createElement('template'),
  p: document.createElement('template'),
  div: document.createElement('template'),
  a: document.createElement('template'),
};

templates.span.innerHTML = `<span><slot></slot></span>`;
templates.h1.innerHTML = `<h1><slot></slot></h1>`;
templates.p.innerHTML = `<p><slot></slot></p>`;
templates.div.innerHTML = `<div><slot></slot></div>`;
templates.a.innerHTML = `<a><slot></slot></a>`;

class InjectorGenerator extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const type = this.getAttribute('type') || 'span';
    const className = this.getAttribute('class') || '';
    const endpoint = this.getAttribute("endpoint");
    const attribute = this.getAttribute("searchAttribute");

    const template = templates[type];
    const content = template.content.cloneNode(true);
    const element = content.firstChild;
    element.className = className;

    // Preserve initial content
    const initialContent = this.innerHTML.trim();

    // Clear the initial content
    this.innerHTML = '';
    // Append content
    this.appendChild(content);

    // Set initial content
    element.innerText = initialContent;

    // Fetch data and set content
    try {
      if (!endpoint) return console.error('No endpoint provided');
      const response = await fetch(endpoint);
      this.removeAttribute('endpoint');
      this.removeAttribute('error');
      this.removeAttribute('type');
      this.removeAttribute('searchattribute');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const query = await data[attribute]

      element.innerText = query ? query : "default missing endpoint attribute";

    } catch (error) {
      console.error('Fetch error:', error);
      // Do not overwrite initial content if fetch fails
    }
  }
}

customElements.define('async-tag', InjectorGenerator);
