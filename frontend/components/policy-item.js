export class PolicyItem extends HTMLElement {
    constructor() {
        super();
        this._instance = null;
    }

    // Define which attributes to watch for changes
    static get observedAttributes() {
        return ['type', 'label', 'datalist', 'interface-name'];
    }

    // Handle attribute updates safely
    attributeChangedCallback() {
        this.render();
    }

    // Allow setting the complex data object as a property
    set instance(value) {
        this._instance = value;
        this.render();
    }

    get instance() {
        return this._instance;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        // Read attributes and extract nested values dynamically
        const type = this.getAttribute('type') || '';
        const label = this.getAttribute('label') || '';
        const datalist = this.getAttribute('datalist') || '';
        const interfaceName = this.getAttribute('interface-name') || '';
        
        const value = this._instance?.['service-policy']?.[type] ?? "";
        const instanceId = this._instance?.id ?? "";

        // Prevent rendering incomplete elements
        if (!type && !this._instance) return;

        this.className = 'policy-item';
        this.innerHTML = `
            <div class="policy-item-label">${label}</div>
            <input type="text" class="policy-item-input" value="${value}" list="${datalist}">
        `;

        const input = this.querySelector('input');

        // Manage focus states
        input.onclick = (e) => {
            e.target.placeholder = e.target.value;
            e.target.value = "";
            e.target.showPicker();
        };
        input.oncancel = (e) => e.target.value = e.target.placeholder;
        input.onblur = (e) => e.target.value = e.target.placeholder;

        // Dispatches event upward instead of performing network operations natively
        input.onkeydown = (e) => {
            if (e.key !== "Enter") return;

            this.dispatchEvent(new CustomEvent('policy-changed', {
                bubbles: true,
                composed: true,
                detail: {
                    type,
                    interfaceName,
                    instanceId,
                    policyName: e.target.value
                }
            }));
        };
    }
}
customElements.define('policy-item', PolicyItem);
