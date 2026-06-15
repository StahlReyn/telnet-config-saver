<script setup lang="ts">
import { computed } from 'vue';
import PolicyItem from './PolicyItem.vue';

// Define the incoming props from the parent InterfaceCard
const props = defineProps({
  interfaceName: { type: String, required: true },
  instance: { type: Object, required: true }
});

// Emits catch the change event from policy components and bubble it to InterfaceCard
const emit = defineEmits(['policy-changed']);

// Clean up description symbols reactively via standard computed property
const cleanedDescription = computed(() => {
  const rawDesc = props.instance.description || '(No description)';
  return rawDesc.replace(/^[\$\*\!\= ]+|[\$\*\!\= ]+$/g, '');
});

// Capture policy changes from grandchildren and bubble them directly up to the parent
function forwardPolicyChange(eventDetail: HTMLInputElement) {
  emit('policy-changed', eventDetail);
}
</script>

<template>
  <div class="service-instance">
    <!-- Meta tracking labels block -->
    <div class="service-id">{{ instance.id }}</div>
    <div class="service-desc fade-text-horizontal">
      {{ cleanedDescription }}
    </div>

    <!-- Layout container encapsulation maps policy rows -->
    <div class="service-policy">
      <!-- Upload Policy Field Mapping -->
      <PolicyItem
        type="input"
        label="Upload:"
        datalist="datalist-input"
        :interface-name="interfaceName"
        :instance="instance"
        @policy-changed="forwardPolicyChange"
      />

      <!-- Download Policy Field Mapping -->
      <PolicyItem
        type="output"
        label="Download:"
        datalist="datalist-output"
        :interface-name="interfaceName"
        :instance="instance"
        @policy-changed="forwardPolicyChange"
      />
    </div>
  </div>
</template>

<style scoped>
/* Paste styling specific to your .service-instance layouts here */
.service-instance {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.service-policy {
  display: flex;
  gap: 0.5rem;
}
</style>
