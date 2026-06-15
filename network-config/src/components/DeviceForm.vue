<script setup lang="ts">
import { reactive } from 'vue'

// Define the exact shape of our form credentials
export interface DeviceFormFields {
  deviceType: string
  host: string
  port: number
  username: string
  password?: string
  secret?: string
}

// Emits the structured data to the parent component when submitted
const emit = defineEmits<{
  (e: 'submit', fields: DeviceFormFields): void
}>()

// Local form state isolated inside the component
const form = reactive<DeviceFormFields>({
  deviceType: 'cisco_ios_telnet',
  host: '172.19.20.218',
  port: 30006,
  username: '',
  password: '',
  secret: '',
})

function handleSubmit() {
  // Emit a shallow copy of the state so parent mutations won't leak backwards
  emit('submit', { ...form })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="device-form">
    <div class="form-group">
      <select v-model="form.deviceType" id="deviceType">
        <option value="cisco_ios_telnet">Cisco IOS (Telnet)</option>
        <option value="cisco_xr_telnet">Cisco XR (Telnet)</option>
        <option value="juniper_telnet">Juniper (Telnet)</option>
      </select>
    </div>

    <div class="form-group">
      <input v-model="form.host" id="host" placeholder="Host" required />
    </div>

    <div class="form-group">
      <input v-model.number="form.port" id="port" type="number" placeholder="Port" required />
    </div>

    <div class="form-group">
      <input v-model="form.username" id="username" placeholder="Username" />
    </div>

    <div class="form-group">
      <input v-model="form.password" id="password" type="password" placeholder="Password" />
    </div>

    <div class="form-group">
      <input v-model="form.secret" id="secret" type="password" placeholder="Secret" />
    </div>

    <button type="submit">Get Configuration</button>
  </form>
</template>

<style scoped>
.device-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.form-card {
  background: var(--color-bg-card);
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 10px var(--shadow-alpha-heavy);
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

/* --- Interactive Elements --- */
.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

button.submit {
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  flex: 1;
}

button.submit:hover {
  background: var(--color-brand-hover);
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgb(from var(--color-brand) r g b / 0.4);
}

button.submit:disabled {
  background: var(--p-neutral-400);
  color: var(--p-neutral-600);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

button.clear {
  background: var(--color-bg-element);
  color: var(--color-text-main);
}

button.clear:hover {
  background: color-mix(in srgb, var(--color-bg-element), black 8%);
}
</style>
