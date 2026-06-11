const form = document.getElementById('deviceForm');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const interfaceContainer = document.getElementById('interfaceContainer');
const rawResponse = document.getElementById('rawResponse');
const filterResultsDiv = document.getElementById('interfaceFilterStatus');
const hideNoServicePolicyCheckbox = document.getElementById('hideNoServicePolicy')

const SERVER_URL = "http://127.0.0.1:8000"

let current_device = {}
let current_data = {}

let template_bandwidth_list = [
    "10M",
    "20M",
    "50M",
    "100M",
    "200M",
    "300M",
]

// ================================ REQUESTS ================================
function getDeviceFormData() {
    return {
        device_type: document.getElementById('deviceType').value,
        host: document.getElementById('host').value,
        port: parseInt(document.getElementById('port').value),
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        secret: document.getElementById('secret').value,
    };
}

async function postWithStatus(url, formData, successCallback) {
    showStatus('loading', 'Processing Request...');
    try {
        const response = await fetch(url, {
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
            showStatus('success', 'Data got successfully!');
            successCallback(data);
        }
    } catch (error) {
        showStatus('error', `Failed to fetch: ${error.message}`);
    }
}

async function getDeviceConfig(event) {
    event.preventDefault();

    current_device = getDeviceFormData()
    resultsDiv.classList.remove('show');
    
    await postWithStatus(SERVER_URL + "/interfaces", current_device, (data) => {
        current_data = data
        refreshDisplayResults()
    })
}

// ================================ STATUS ================================

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

    const nameDescDiv = document.createElement('div');
    nameDescDiv.className = 'interface-name-container';
    nameDescDiv.innerHTML = (`
        <div class="interface-name">${interfaceName}</div>
        <div class="interface-description">${config.description || '(No description)'}</div>
    `)

    const servicesDiv = document.createElement('div');
    servicesDiv.className = 'service-instances';

    if (!config.service_instance || config.service_instance.length === 0) {
        servicesDiv.innerHTML = '<div class="service-instances-empty">No service instances</div>';
    } else {
        config.service_instance.forEach(instance => {
            const instanceDiv = createInstanceCard(interfaceName, instance)
            servicesDiv.appendChild(instanceDiv);
        });
    }

    card.appendChild(nameDescDiv);
    card.appendChild(servicesDiv);
    return card;
}

function createInstanceCard(interfaceName, instance) {
    const instanceDiv = document.createElement('div');
    instanceDiv.className = 'service-instance';

    const idDiv = document.createElement('div');
    idDiv.className = 'service-id';
    idDiv.textContent = `${instance.id}`;

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

    const bandwithButtonsContainer = document.createElement('div');
    bandwithButtonsContainer.className = 'bandwith-buttons-container';
    for (const bandwidth of template_bandwidth_list) {
        const bandwidthButton = createBandwidthButton(interfaceName, instance.id, bandwidth)
        bandwithButtonsContainer.appendChild(bandwidthButton);
    }

    instanceDiv.appendChild(idDiv);
    instanceDiv.appendChild(policyDiv);
    instanceDiv.appendChild(bandwithButtonsContainer);
    return instanceDiv
}

function createBandwidthButton(interfaceName, instanceId, bandwidth) {
    const bandwidthButton = document.createElement('button');
    bandwidthButton.className = 'bandwidth-button';
    bandwidthButton.textContent = bandwidth

    const formData = {
        "device": current_device,
        "service_policy": {
            "interface": interfaceName,
            "service_instance_id": instanceId,
            "bandwidth": bandwidth
        }
    }

    bandwidthButton.addEventListener('click', async (e) => {
        await postWithStatus(SERVER_URL + "/config/service-policy-bandwidth", formData, (data) => {
            current_data = data
            refreshDisplayResults()
        })
    })

    return bandwidthButton
}

form.addEventListener('submit', getDeviceConfig);
hideNoServicePolicyCheckbox.addEventListener('change', refreshDisplayResults)