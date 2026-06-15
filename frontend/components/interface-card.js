export class InterfaceCard extends HTMLElement {
    constructor() {
        super();
        this._device = null;
        this._config = null;
        this._interfaceName = '';
    }

    setContext(device, interfaceName, interfaceConfig) {
        this._device = device
        this._interfaceName = interfaceName;
        this._config = interfaceConfig;
        this.render();
    }

    connectedCallback() {
        this.render();
        // Single, centralized listener catches changes from ANY inner policy input element
        this.addEventListener('policy-changed', this.handlePolicyUpdate.bind(this));
    }

    async handlePolicyUpdate(event) {
        const { type, interfaceName, instanceId, policyName } = event.detail;

        const currentPayload = {
            "device": device,
            "policy": {
                "interface": interfaceName,
                "service_instance_id": instanceId,
                "policy_name": policyName
            }
        };

        console.log("Sending:", currentPayload);

        await postWithStatus(
            `${SERVER_URL}/config/service-policy/${type}`, 
            currentPayload, 
            (data) => {
                current_data = data;
                refreshDisplayResults();
            }
        );
    }

    render() {
        if (!this._config) return;

        this.className = 'interface-card';
        this.innerHTML = `
            <details>
                <summary class="interface-header">
                    <div class="interface-name">${this._interfaceName}</div>
                    <div class="interface-description">${this._config.description || "(No description)"}</div>
                </summary>
                <div class="service-instances"></div>
            </details>
        `;

        const servicesDiv = this.querySelector('.service-instances');
        const instances = this._config.service_instance || [];

        if (instances.length === 0) {
            servicesDiv.innerHTML = '<div class="service-instances-empty">No service instances</div>';
        } else {
            instances.forEach(instance => {
                const instanceElem = document.createElement('service-instance');
                // Pass dependencies dynamically down as an object
                instanceElem.data = { interfaceName: this._interfaceName, instance };
                servicesDiv.appendChild(instanceElem);
            });
        }
    }
}
customElements.define('interface-card', InterfaceCard);
