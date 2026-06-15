<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import DeviceForm, { type DeviceFormFields } from './components/DeviceForm.vue'
import InterfaceCard from './components/InterfaceCard.vue'

const SERVER_URL = 'http://192.168.194.1:8000'
const TEST_RESPONSE = true
const TEST_JSON = 'data/test_response.json'

interface NetworkInterface {
  description: string
  service_instance: ServiceInstance[]
}

interface ServiceInstance {
  id: number
  service_policy: ServicePolicy
  description: string
}

interface ServicePolicy {
  input: string
  output: string
}

interface PolicyPayload {
  type: string
  interfaceName: string
  instanceId: number
  policyName: string
}

// Global UI Feedback State
const status = reactive({
  type: '', // 'loading' | 'success' | 'error'
  message: '',
})

const showResults = ref(false)
const hideNoServicePolicy = ref(false)
const rawData = ref<Record<string, NetworkInterface>>({})

// Keep a reference to the active device credentials for subsequent policy updates
const activeDevice = ref<DeviceFormFields | null>(null)

const dataListInput = [
  'police-10M',
  'police-20M',
  'police-50M',
  'police-100M',
  'police-200M',
  'police-300M',
]
const dataListOutput = [
  'shape-10M',
  'shape-20M',
  'shape-50M',
  'shape-100M',
  'shape-200M',
  'shape-300M',
]
const dataListBandwidth = ['10M', '20M', '50M', '100M', '200M', '300M']

const totalCount = computed(() => {
  return Object.values(rawData.value).filter((config) => typeof config === 'object').length
})

const filteredInterfaces = computed(() => {
  const list = []
  for (const [interfaceName, config] of Object.entries(rawData.value)) {
    if (typeof config !== 'object') continue
    if (!config) continue

    const hasService = config.service_instance && config.service_instance.length > 0
    if (hideNoServicePolicy.value && !hasService) continue

    list.push({ name: interfaceName, config })
  }
  return list
})

const formattedRawResponse = computed(() => JSON.stringify(rawData.value, null, 2))

function setStatus(type: 'loading' | 'success' | 'error' | '', message: string) {
  status.type = type
  status.message = message
}

// Core Fetch Configurations Triggered by the child form
async function handleDeviceSubmit(formData: DeviceFormFields) {
  showResults.value = false
  activeDevice.value = formData // Store references dynamically for policy patch updates

  if (TEST_RESPONSE) {
    try {
      const response = await fetch(TEST_JSON)
      if (!response.ok) throw new Error('No Test JSON')
      rawData.value = await response.json()
      showResults.value = true
    } catch (error) {
      setStatus('error', `Test JSON Error: ${(error as Error).message}`)
    }
    return
  }

  setStatus('loading', 'Processing Request...')

  try {
    const response = await fetch(`${SERVER_URL}/interfaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_type: formData.deviceType,
        host: formData.host,
        port: formData.port,
        username: formData.username,
        password: formData.password,
        secret: formData.secret,
      }),
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    if (data.error) {
      setStatus('error', `Error: ${data.error}`)
    } else {
      setStatus('success', 'Data retrieved successfully!')
      rawData.value = data
      showResults.value = true
    }
  } catch (error) {
    setStatus('error', `Failed to fetch: ${(error as Error).message}`)
  }
}

// Handle Child Component Updates
async function handleGlobalPolicyUpdate(payload: PolicyPayload) {
  if (!activeDevice.value) return

  const currentPayload = {
    device: {
      device_type: activeDevice.value.deviceType,
      host: activeDevice.value.host,
      port: activeDevice.value.port,
      username: activeDevice.value.username,
      password: activeDevice.value.password,
      secret: activeDevice.value.secret,
    },
    policy: {
      interface: payload.interfaceName,
      service_instance_id: payload.instanceId,
      policy_name: payload.policyName,
    },
  }

  setStatus('loading', 'Updating Policy Configuration...')

  try {
    const response = await fetch(`${SERVER_URL}/config/service-policy/${payload.type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentPayload),
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    if (data.error) {
      setStatus('error', `Update failed: ${data.error}`)
    } else {
      setStatus('success', 'Policy updated successfully!')
      rawData.value = data
    }
  } catch (error) {
    setStatus('error', `Failed to sync policy: ${(error as Error).message}`)
  }
}
</script>

<template>
  <div class="device-manager">
    <!-- Decoupled Component cleanly handling inputs -->
    <div class="card">
      <h2>Input Form</h2>
      <DeviceForm @submit="handleDeviceSubmit" />
    </div>

    <!-- Status Boxes & Filters -->
    <div v-if="status.message" :class="['status', status.type]">
      {{ status.message }}
    </div>

    <!-- Interface Matrix -->
    <div v-if="showResults" class="card results show" id="results">
      <h2>Interfaces</h2>
      <div class="controls">
        <div>
          <input v-model="hideNoServicePolicy" type="checkbox" id="hideNoServicePolicy" />
          <label for="hideNoServicePolicy"> Hide interfaces with no service policy </label>
        </div>
        <small id="interfaceFilterStatus">
          Showing {{ filteredInterfaces.length }}/{{ totalCount }} interfaces
        </small>
      </div>
      <datalist id="datalist-input">
        <option v-for="val in dataListInput" :key="val" :value="val" />
      </datalist>
      <datalist id="datalist-output">
        <option v-for="val in dataListOutput" :key="val" :value="val" />
      </datalist>
      <datalist id="datalist-bandwidth">
        <option v-for="val in dataListBandwidth" :key="val" :value="val" />
      </datalist>

      <div id="interfaceContainer">
        <InterfaceCard
          v-for="item in filteredInterfaces"
          :key="item.name"
          :device="activeDevice || {}"
          :interface-name="item.name"
          :config="item.config"
          @policy-updated="handleGlobalPolicyUpdate"
        />
      </div>
    </div>

    <div v-if="showResults" class="card show" id="rawResponse">
      <h2>Raw Response</h2>
      <pre><code>{{ formattedRawResponse }}</code></pre>
    </div>
  </div>
</template>

<style src="./tokens.css"></style>
<style scoped>
.device-manager {
  margin: auto;
  width: max-content;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 5px var(--shadow-alpha-heavy);
  flex-grow: 1;
}

.status {
  margin: 0;
  padding: 15px;
  font-weight: 500;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  box-shadow: 0 0 10px var(--shadow-alpha-heavy);
  background-color: var(--color-bg-card);
  z-index: 100;
}

.status.loading {
  display: block;
  background: var(--status-load-bg);
  color: var(--status-load-text);
}

.status.error {
  display: block;
  background: var(--status-err-bg);
  color: var(--status-err-text);
}

.status.success {
  display: block;
  background: var(--status-succ-bg);
  color: var(--status-succ-text);
}

#interfaceContainer {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* --- Response Payloads --- */
.raw-response {
  margin-top: 20px;
  padding: 20px;
  background: var(--color-bg-nested);
  border-radius: 10px;
}

.raw-response h3 {
  margin-bottom: 10px;
  color: var(--color-text-main);
}

.controls {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

pre {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
