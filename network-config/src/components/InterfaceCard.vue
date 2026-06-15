<script setup lang="ts">
import { computed } from 'vue'
import ServiceInstance from './ServiceInstance.vue'

// Define the incoming parameters from the parent component
const props = defineProps({
  device: { type: Object, required: true },
  interfaceName: { type: String, required: true },
  config: { type: Object, required: true },
})

// Emits tell the parent component when an update needs to be sent to the API
const emit = defineEmits(['policy-updated'])

// Computed array abstraction simplifies template execution
const serviceInstances = computed(() => {
  return props.config.service_instance || []
})

// Capture the custom event bubble up from children and forward it to the root wrapper
function handlePolicyChanged(eventDetail: HTMLInputElement) {
  emit('policy-updated', eventDetail)
}
</script>

<template>
  <div v-if="config" class="interface-card">
    <details>
      <!-- Clickable details wrapper toggles visibility safely -->
      <summary class="interface-header">
        <div class="interface-name">{{ interfaceName }}</div>
        <div class="interface-description">
          {{ config.description || '(No description)' }}
        </div>
      </summary>

      <!-- Sub-container element grouping structural components -->
      <div class="service-instances">
        <div v-if="serviceInstances.length === 0" class="service-instances-empty">
          No service instances
        </div>

        <!-- Render Child Vue Service Instance Components Direct -->
        <ServiceInstance
          v-for="instance in serviceInstances"
          :key="instance.id || instance.number"
          :interface-name="interfaceName"
          :instance="instance"
          @policy-changed="handlePolicyChanged"
        />
      </div>
    </details>
  </div>
</template>

<style scoped>
.interface-card {
  background: var(--color-bg-card);
  border-radius: 5px;
  padding: 2px 12px;
  box-shadow: 0 2px 5px var(--shadow-alpha-main);
  border-left: 4px solid var(--color-brand);
  /* overflow: hidden; */
}

.interface-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 8px 0;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg-card);
}

details[open] > .interface-header {
  margin-bottom: 5px;
  border-bottom: 2px solid var(--color-border-divider);
}
/* Create the invisible expanded hit target */
.interface-header::after {
  content: '';
  position: absolute;
  /* Expand the click zone by 10px in all directions */
  top: -10px;
  right: -10px;
  bottom: -10px;
  left: -10px;
  /* Alternative modern property: inset: -10px; */
}

.interface-name {
  font-size: 1.2em;
  font-weight: 700;
  color: var(--color-text-main);
}

.interface-description {
  font-size: 0.9em;
  color: var(--color-text-muted);
  min-height: 20px;
  margin: auto 0;
}

summary:hover > * {
  color: var(--color-brand-hover);
}

.service-instances {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.service-instances-empty {
  color: #888;
  font-style: italic;
}
</style>
