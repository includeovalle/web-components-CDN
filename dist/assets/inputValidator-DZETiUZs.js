class r extends HTMLElement{static get observedAttributes(){return["type","checkid","pattern"]}constructor(){super(),this.attachShadow({mode:"open"});const e=new CSSStyleSheet;e.replaceSync(`
      .message {
        margin: 0;
        color: mintcream;
      }
      .hidden {
        display: none;
      }
      .display {
        display: block;
      }
    `),this.shadowRoot.adoptedStyleSheets=[e]}connectedCallback(){this.inputElement=document.getElementById(this.checkId),this.inputElement&&(this.inputElement.addEventListener("input",this.handleInput.bind(this)),this.render())}disconnectedCallback(){this.inputElement&&this.inputElement.removeEventListener("input",this.handleInput.bind(this))}attributeChangedCallback(e,i,t){i!==t&&e==="checkid"&&(this.inputElement&&this.inputElement.removeEventListener("input",this.handleInput.bind(this)),this.inputElement=document.getElementById(this.checkId),this.inputElement&&this.inputElement.addEventListener("input",this.handleInput.bind(this))),this.render()}get type(){return this.getAttribute("type")||"span"}get checkId(){return this.getAttribute("checkid")}get pattern(){return this.getAttribute("pattern")}handleInput(){this.render()}validateInput(){if(!this.inputElement)return{isValid:!1,missingParts:[]};const e=this.inputElement.value,i=this.pattern.split(",").map(n=>n.trim()),t=[];for(const n of i){const s=n.match(/(.+)\{(\d+)\}/);let a,l=1;s?(a=new RegExp(s[1],"g"),l=parseInt(s[2],10)):a=new RegExp(n,"g");const h=e.match(a)||[],d=l-h.length;d>0&&t.push(`${d} que sea ${n.replace(/\{.*\}/,"")}`)}return{isValid:t.length===0,missingParts:t}}render(){const{isValid:e,missingParts:i}=this.validateInput();let t=this.shadowRoot.querySelector(this.type);t||(t=document.createElement(this.type),this.shadowRoot.appendChild(t)),t.className="message",this.inputElement.value.trim()===""||e?(t.classList.add("hidden"),t.classList.remove("display")):(t.textContent=`Falta: ${i.join(", ")}`,t.classList.add("display"),t.classList.remove("hidden"))}}customElements.define("validation-component",r);
