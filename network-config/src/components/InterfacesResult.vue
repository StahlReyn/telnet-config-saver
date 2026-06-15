<script setup lang="ts">
import { ref, computed } from 'vue'
import InterfaceCard from './InterfaceCard.vue'

interface NetworkInterface {
  description: string
  service_instance: Object[]
}

const props = defineProps({
  rawData: { type: Object, required: true },
})

// Emits tell the parent component when an update needs to be sent to the API
const emit = defineEmits(['policy-updated'])

// Capture the custom event bubble up from children and forward it to the root wrapper
function handlePolicyChanged(eventDetail: HTMLInputElement) {
  emit('policy-updated', eventDetail)
}

const hideNoServicePolicy = ref(false)

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
  return Object.values(props.rawData).filter((config) => typeof config === 'object').length
})

const filteredInterfaces = computed(() => {
  const list = []
  for (const [interfaceName, config] of Object.entries(props.rawData)) {
    if (!config || typeof config !== 'object') continue
    
    const interfaceData = config as NetworkInterface
    const hasService = interfaceData.service_instance && interfaceData.service_instance.length > 0
    if (hideNoServicePolicy.value && !hasService) continue

    list.push({ name: interfaceName, config })
  }
  return list
})
</script>

<template>
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

  <div class="interfaceContainer">
    <InterfaceCard
      v-for="item in filteredInterfaces"
      :key="item.name"
      :interface-name="item.name"
      :config="item.config"
      @policy-updated="handlePolicyChanged"
    />
  </div>
</template>

<style scoped>
.interfaceContainer {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.controls {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
</style>