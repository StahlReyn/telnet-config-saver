import './components/interface-card.js';
import './components/policy-item.js';
import './components/service-instance.js';

const form = document.getElementById('deviceForm');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const interfaceContainer = document.getElementById('interfaceContainer');
const rawResponse = document.getElementById('rawResponse');
const filterResultsDiv = document.getElementById('interfaceFilterStatus');
const hideNoServicePolicyCheckbox = document.getElementById('hideNoServicePolicy')

const SERVER_URL = "http://192.168.194.1:8000";
const TEST_RESPONSE = true;
const TEST_JSON = "./test_response.json";

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

    if (TEST_RESPONSE) {
        console.log("LOADING TEST JSON")
        const response = await fetch(TEST_JSON)
        if (!response.ok) throw new Error('No Test JSON');
        const data = await response.json();
        console.log(data);
        current_data = data;
        refreshDisplayResults();
        return;
    }
    
    await postWithStatus(SERVER_URL + "/interfaces", current_device, (data) => {
        current_data = data;
        refreshDisplayResults();
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
        const interfaceCard = document.createElement('interface-card');
        customElements.whenDefined('interface-card').then(() => {
            interfaceCard.setContext(interfaceName, config);
        });
        document.body.appendChild(interfaceCard);
        interfaceContainer.appendChild(interfaceCard);
        shown_count += 1;
    }

    filterResultsDiv.textContent = `Showing ${shown_count}/${total_count} interfaces`
}

function setupDataList(id, list) {
    const dataList = document.createElement('datalist');
    dataList.id = id;
    for (const value of list) {
        dataList.innerHTML += `<option value="${value}">`
    }
    interfaceContainer.appendChild(dataList)
}

form.addEventListener('submit', getDeviceConfig);
hideNoServicePolicyCheckbox.addEventListener('change', refreshDisplayResults)