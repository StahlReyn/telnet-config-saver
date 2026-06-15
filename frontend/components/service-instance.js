export class ServiceInstance extends HTMLElement {
    constructor() {
        super();
        this._instance = null;
    }

    set data({ interfaceName, instance }) {
        this._interfaceName = interfaceName;
        this._instance = instance;
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this._instance) return;

        const displayDesc = (this._instance.description || '(No description)')
            .replace(/^[\$\*\!\= ]+|[\$\*\!\= ]+$/g, '');

        this.className = 'service-instance';
        this.innerHTML = `
            <div class="service-id">${this._instance.id}</div>
            <div class="service-desc fade-text-horizontal">${displayDesc}</div>
            <div class="service-policy"></div>
        `;

        const policyContainer = this.querySelector('.service-policy');

        // Create and configure Upload element
        const uploadItem = document.createElement('policy-item');
        uploadItem.setAttribute('type', 'input');
        uploadItem.setAttribute('label', 'Upload:');
        uploadItem.setAttribute('datalist', 'datalist-input');
        uploadItem.setAttribute('interface-name', this._interfaceName);
        uploadItem.instance = this._instance;

        // Create and configure Download element
        const downloadItem = document.createElement('policy-item');
        downloadItem.setAttribute('type', 'output');
        downloadItem.setAttribute('label', 'Download:');
        downloadItem.setAttribute('datalist', 'datalist-output');
        downloadItem.setAttribute('interface-name', this._interfaceName);
        downloadItem.instance = this._instance;

        policyContainer.appendChild(uploadItem);
        policyContainer.appendChild(downloadItem);
    }
}
customElements.define('service-instance', ServiceInstance);
