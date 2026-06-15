<script setup lang="ts">
import { computed } from 'vue';
import ServiceInstance from './ServiceInstance.vue';

// Define the incoming parameters from the parent component
const props = defineProps({
  device: { type: Object, required: true },
  interfaceName: { type: String, required: true },
  config: { type: Object, required: true }
});

// Emits tell the parent component when an update needs to be sent to the API
const emit = defineEmits(['policy-updated']);

// Computed array abstraction simplifies template execution
const serviceInstances = computed(() => {
  return props.config.service_instance || [];
});

// Capture the custom event bubble up from children and forward it to the root wrapper
function handlePolicyChanged(eventDetail: HTMLInputElement) {
  emit('policy-updated', eventDetail);
}
</script>

<template>
  <div v-if="config" class="interface-card">
    <details>
      <!-- Clickable details wrapper toggles visibility safely -->
      <summary class="interface-header">
        <div class="interface-name">{{ interfaceName }}</div>
        <div class="interface-description">
          {{ config.description || "(No description)" }}
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
/* Paste styling specific to .interface-card wrapper element scopes here */
.interface-header {
  cursor: pointer;
}
.service-instances-empty {
  color: #888;
  font-style: italic;
}
</style>
