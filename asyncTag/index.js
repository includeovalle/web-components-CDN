// async-tag-injector.js

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
    // No shadow DOM
  }

  async connectedCallback() {
    const type = this.getAttribute('type') || 'span';
    const className = this.getAttribute('class') || '';
    const endpoint = this.getAttribute("endpoint");
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
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Fetched data:', data.user);
      element.innerText = data.user; // Adjust 'user' to the correct property in your JSON
    } catch (error) {
      console.error('Fetch error:', error);
      // Do not overwrite initial content if fetch fails
    }
  }
}

customElements.define('async-tag', InjectorGenerator);
