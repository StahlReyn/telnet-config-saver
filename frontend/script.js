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

// Input Output ay be different to each other. Change Later
let dataListInput = [
    "police-10M",
    "police-20M",
    "police-50M",
    "police-100M",
    "police-200M",
    "police-300M",
]

let dataListOutput = [
    "shape-10M",
    "shape-20M",
    "shape-50M",
    "shape-100M",
    "shape-200M",
    "shape-300M",
]

let dataListBandwidth = [
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

    setupDataList("datalist-input", dataListInput)
    setupDataList("datalist-output", dataListOutput)
    setupDataList("datalist-bandwidth", dataListBandwidth)

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

    const policy = instance['service-policy'];
    const policyDiv = document.createElement('div');
    policyDiv.className = 'service-policy';
    policyDiv.appendChild(createPolicyDiv("input", "Upload:", policy?.input ?? "", "datalist-input", interfaceName, instance.id));
    policyDiv.appendChild(createPolicyDiv("output", "Download:", policy?.output ?? "", "datalist-output", interfaceName, instance.id));

    instanceDiv.appendChild(idDiv);
    instanceDiv.appendChild(descDiv);
    instanceDiv.appendChild(policyDiv);
    
    return instanceDiv
}

// Policy display also count as input hooked to input or output
// TO DO: REFACTOR LATER
function createPolicyDiv(type, label, value, datalist, interfaceName, instance_id) {
    const card = document.createElement('div');
    card.className = 'policy-item';

    const labelDiv = document.createElement('div');
    labelDiv.textContent = label;
    labelDiv.className = 'policy-item-label';

    const policyInput = document.createElement('input');
    policyInput.className = 'policy-item-input';
    policyInput.type = 'text'
    policyInput.value = value;
    policyInput.setAttribute('list', datalist); 
    policyInput.onclick = (e) => {
        e.target.placeholder = e.target.value;
        e.target.value = "";
        e.target.showPicker();
    };
    policyInput.oncancel = (e) => {e.target.value = e.target.placeholder;}
    policyInput.onblur = (e) => {e.target.value = e.target.placeholder;}
    policyInput.onkeydown = async (e) => {
        if (e.key !== "Enter") return;
        const currentPayload = {
            "device": current_device,
            "policy": {
                "interface": interfaceName,
                "service_instance_id": instance_id,
                "policy_name": e.target.value
            }
        };
        console.log("Sending:", currentPayload);
        await postWithStatus(
            SERVER_URL + "/config/service-policy/" + type, 
            currentPayload, 
            (data) => {
                current_data = data;
                refreshDisplayResults();
            }
        );
    };
    
    card.appendChild(labelDiv);
    card.appendChild(policyInput);
    return card;
}

function setupDataList(id, list) {
    const dataList = document.createElement('datalist');
    dataList.id = id;
    for (const value of list) {
        dataList.innerHTML += `<option value="${value}">`
    }
    interfaceContainer.appendChild(dataList)
}


// ==== OLD ====

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