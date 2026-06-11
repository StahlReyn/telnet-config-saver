const form = document.getElementById('deviceForm');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const interfaceContainer = document.getElementById('interfaceContainer');
const rawResponse = document.getElementById('rawResponse');
const filterResultsDiv = document.getElementById('interfaceFilterStatus');
const hideNoServicePolicyCheckbox = document.getElementById('hideNoServicePolicy')

const SERVER_URL = "http://127.0.0.1:8000/interfaces"

let current_data = {}

async function getDeviceConfig(event) {
    event.preventDefault();

    const formData = {
        device_type: document.getElementById('deviceType').value,
        host: document.getElementById('host').value,
        port: parseInt(document.getElementById('port').value),
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        secret: document.getElementById('secret').value,
    };

    showStatus('loading', 'Fetching configuration...');
    resultsDiv.classList.remove('show');

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            showStatus('error', `Error: ${data.error}`);
        } else {
            showStatus('success', 'Configuration retrieved successfully!');
            current_data = data;
            refreshDisplayResults();
        }
    } catch (error) {
        showStatus('error', `Failed to fetch configuration: ${error.message}`);
    }
}

function showStatus(type, message) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

function refreshDisplayResults() {
    console.log("Refresh Display")
    displayResults(current_data);
}

function displayResults(data) {
    interfaceContainer.innerHTML = '';
    rawResponse.textContent = JSON.stringify(data, null, 2);
    resultsDiv.classList.add('show');

    let hideNoServicePolicy = hideNoServicePolicyCheckbox.checked

    let total_count = 0;
    let shown_count = 0;
    for (const [interfaceName, config] of Object.entries(data)) {
        if (typeof config !== 'object') continue;
        total_count += 1;
        // Skip no service policy
        if (hideNoServicePolicy && (!config.service_instance || config.service_instance.length === 0)) continue;
        const card = createInterfaceCard(interfaceName, config);
        interfaceContainer.appendChild(card);
        shown_count += 1;
    }

    filterResultsDiv.textContent = `Showing ${shown_count}/${total_count} interfaces`
}

function createInterfaceCard(interfaceName, config) {
    const card = document.createElement('div');
    card.className = 'interface-card';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'interface-name';
    nameDiv.textContent = interfaceName;

    const descDiv = document.createElement('div');
    descDiv.className = 'interface-description';
    descDiv.textContent = config.description || '(No description)';

    const servicesDiv = document.createElement('div');
    servicesDiv.className = 'service-instances';

    if (!config.service_instance || config.service_instance.length === 0) {
        servicesDiv.innerHTML = '<div class="service-instances-empty">No service instances</div>';
    } else {
        config.service_instance.forEach(instance => {
            const instanceDiv = createInstanceCard(instance)
            servicesDiv.appendChild(instanceDiv);
        });
    }

    card.appendChild(nameDiv);
    card.appendChild(descDiv);
    card.appendChild(servicesDiv);
    return card;
}

function createInstanceCard(instance) {
    const instanceDiv = document.createElement('div');
    instanceDiv.className = 'service-instance';

    const idDiv = document.createElement('div');
    idDiv.className = 'service-id';
    idDiv.textContent = `Instance ID: ${instance.id}`;

    const policyDiv = document.createElement('div');
    policyDiv.className = 'service-policy';

    if (!instance['service-policy'] || Object.keys(instance['service-policy']).length === 0) {
        policyDiv.innerHTML = '<div class="no-policy">No service policy</div>';
    } else {
        const policy = instance['service-policy'];
        let policyHtml = '';
        if (policy.input) {
            policyHtml += `<div class="policy-item"><strong>Input:</strong> ${policy.input}</div>`;
        }
        if (policy.output) {
            policyHtml += `<div class="policy-item"><strong>Output:</strong> ${policy.output}</div>`;
        }
        policyDiv.innerHTML = policyHtml;
    }

    instanceDiv.appendChild(idDiv);
    instanceDiv.appendChild(policyDiv);
    return instanceDiv
}

form.addEventListener('submit', getDeviceConfig);
hideNoServicePolicyCheckbox.addEventListener('change', refreshDisplayResults)