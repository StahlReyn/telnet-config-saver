const form = document.getElementById('deviceForm');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const interfaceContainer = document.getElementById('interfaceContainer');
const rawResponse = document.getElementById('rawResponse');
const filterResultsDiv = document.getElementById('interfaceFilterStatus');
const hideNoServicePolicyCheckbox = document.getElementById('hideNoServicePolicy')

const SERVER_URL = "http://192.168.194.1:8000"

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

    setupBandwidthDataList()

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
    const card = document.createElement('details');
    card.className = 'interface-card';

    // Header Div
    const interfaceHeaderDiv = document.createElement('summary');
    interfaceHeaderDiv.className = 'interface-header';

    const interfaceNameDiv = document.createElement('div');
    interfaceNameDiv.className = "interface-name";
    interfaceNameDiv.textContent = interfaceName;

    const interfaceDescDiv = document.createElement('div');
    interfaceDescDiv.className = "interface-description";
    interfaceDescDiv.textContent = config.description || "(No description)";

    interfaceHeaderDiv.appendChild(interfaceNameDiv);
    interfaceHeaderDiv.appendChild(interfaceDescDiv);

    // Service Div
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

    card.appendChild(interfaceHeaderDiv);
    card.appendChild(servicesDiv);
    return card;
}

function createInstanceCard(interfaceName, instance) {
    const instanceDiv = document.createElement('div');
    instanceDiv.className = 'service-instance';

    const idDiv = document.createElement('div');
    idDiv.className = 'service-id';
    idDiv.textContent = `${instance.id}`;

    display_desc = instance.description || '(No description)';
    display_desc = display_desc.replace(/^[\$\*\!\= ]+|[\$\*\!\= ]+$/g, '');
    const descDiv = document.createElement('div');
    descDiv.className = 'service-desc fade-text-horizontal';
    descDiv.textContent = `${display_desc}`;

    const policyDiv = document.createElement('div');
    policyDiv.className = 'service-policy';

    const policy = instance['service-policy'];
    let policyHtml = '';
    if (policy && policy.input) {
        policyHtml += `<div class="policy-item"><strong>Upload:</strong> ${policy.input}</div>`;
    } else {
        policyHtml += '<div class="no-policy">No upload policy</div>'
    }
    if (policy && policy.output) {
        policyHtml += `<div class="policy-item"><strong>Download:</strong> ${policy.output}</div>`;
    } else {
        policyHtml += '<div class="no-policy">No download policy</div>'
    }
    policyDiv.innerHTML = policyHtml;

    instanceDiv.appendChild(idDiv);
    instanceDiv.appendChild(descDiv);
    instanceDiv.appendChild(policyDiv);
    
    return instanceDiv
}

function createPolicyDiv(label, value) {
    const card = document.createElement('div');
    card.className = 'policy-item';

    const labelDiv = document.createElement('div');
    card.textContent = label;

    const policyInput = document.createElement('input');
    policyInput.value = value;
    
    policyInput.a
}

function setupBandwidthDataList() {
    const dataList = document.createElement('datalist');
    dataList.id = "bandwidth-list";
    for (const bandwidth of template_bandwidth_list) {
        dataList.innerHTML += `<option value="${bandwidth}">`
    }
    interfaceContainer.appendChild(dataList)
}

function createBandwidthInput(interfaceName, instanceId) {
    const bandwidthContainer = document.createElement('div')
    bandwidthContainer.className = 'bandwith-buttons-container';
    bandwidthContainer.innerHTML = `
        <input 
            type="text" 
            id="bandwidth-choice" 
            name="bandwidth" 
            placeholder="Enter Bandwidth" 
            list="bandwidth-list"
            onclick="this.showPicker()"
        >
    `

    // Target the actual input element inside the container
    const realInput = bandwidthContainer.querySelector('input');

    function getFormData() {
        return {
            "device": current_device,
            "service_policy": {
                "interface": interfaceName,
                "service_instance_id": instanceId,
                "bandwidth": realInput.value
            }
        };
    }

    bandwidthContainer.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return;
        
        // getFormData() evaluates NOW and captures the exact text currently in the input field
        const currentPayload = getFormData(); 
        
        await postWithStatus(
            SERVER_URL + "/config/service-policy/bandwidth", 
            currentPayload, 
            (data) => {
                current_data = data;
                refreshDisplayResults();
            }
        );
    });

    return bandwidthContainer
}

form.addEventListener('submit', getDeviceConfig);
hideNoServicePolicyCheckbox.addEventListener('change', refreshDisplayResults)