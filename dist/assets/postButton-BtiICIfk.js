class s extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"});const t=new CSSStyleSheet;t.replaceSync(`
      :host {
        display: inline-block;
        cursor: pointer;
        padding: 0.5rem 1rem;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        text-align: center;
      }

      :host(.loading) {
        background-color: #6c757d;
        cursor: not-allowed;
      }

      :host(.error) {
        background-color: #dc3545;
      }
    `),this.shadowRoot.adoptedStyleSheets=[t],this.button=document.createElement("button"),this.button.textContent=this.textContent.trim()||"Logout",this.shadowRoot.appendChild(this.button)}connectedCallback(){this.button.addEventListener("click",()=>this.handleLogout())}disconnectedCallback(){this.button.removeEventListener("click",()=>this.handleLogout())}async handleLogout(){const t=this.getAttribute("endpoint"),e=this.getAttribute("href"),o=this.getAttribute("updatedText")||"Successfully logged out, redirecting...",n=this.getAttribute("error")||"Something went wrong";if(!t||!e){console.error("Endpoint and href attributes are required.");return}this.button.classList.add("loading"),this.button.textContent="Logging out...";try{if((await fetch(t,{method:"POST"})).ok)this.button.textContent=o,setTimeout(()=>{window.location.href=e},1900);else throw new Error}catch{this.button.textContent=n,this.button.classList.add("error")}finally{this.button.classList.remove("loading")}}}customElements.define("post-button",s);
