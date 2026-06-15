<script setup lang="ts">
import { ref, computed } from 'vue'

// Define explicit prop bindings replacing getAttribute checks
const props = defineProps({
  type: { type: String, required: true },
  label: { type: String, required: true },
  datalist: { type: String, required: true },
  interfaceName: { type: String, required: true },
  instance: { type: Object, required: true },
})

const emit = defineEmits(['policy-changed'])

// Local reactive state tracks active manual placeholder swaps on focus
const displayValue = ref('')
const placeholder = ref('')

// Dynamically compute the backend value when instance changes
const backendValue = computed(() => {
  return props.instance?.['service-policy']?.[props.type] ?? ''
})

// Sync local display state whenever backend value changes, initializing component
displayValue.value = backendValue.value

// Input interaction event handlers
function handleFocus() {
  placeholder.value = displayValue.value
  displayValue.value = ''
}

function handleBlur() {
  if (!displayValue.value) {
    displayValue.value = placeholder.value
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return

  const target = event.target as HTMLInputElement

  // Emit data object upwards cleanly replacing deep DOM bubbling setups
  emit('policy-changed', {
    type: props.type,
    interfaceName: props.interfaceName,
    instanceId: props.instance?.id ?? '',
    policyName: displayValue.value,
  })

  // Remove cursor focus after saving
  target.blur()
}
</script>

<template>
  <div class="policy-item">
    <div class="policy-item-label">{{ label }}</div>
    <input
      v-model="displayValue"
      type="text"
      class="policy-item-input"
      :list="datalist"
      :placeholder="placeholder"
      @click="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeyDown"
    />
  </div>
</template>

<style scoped>
.policy-item {
  display: flex;
  align-items: center;
  color: var(--color-text-muted);
  margin: auto;
  padding: 4px;
  background: var(--color-bg-card);
  border-radius: 3px;
  border-left: 3px solid var(--p-green-700);
  min-width: 14em;

  flex-grow: 1;
  flex-basis: 0;
  display: flex;
  gap: 6px;
}

.policy-item:nth-child(1) {
  border-color: var(--p-red-700);
}

.policy-item-label {
  margin: auto;
  font-weight: bold;
}

.policy-item-input {
  min-width: 6em;
  padding: 4px;
  flex-grow: 1;
}

.no-policy {
  color: var(--color-text-empty);
  font-style: italic;
  border-color: var(--p-neutral-400);
  background: transparent;
}
</style>
