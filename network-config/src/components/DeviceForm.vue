<script setup lang="ts">
import { reactive } from 'vue';

// Define the exact shape of our form credentials
export interface DeviceFormFields {
  deviceType: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  secret?: string;
}

// Emits the structured data to the parent component when submitted
const emit = defineEmits<{
  (e: 'submit', fields: DeviceFormFields): void;
}>();

// Local form state isolated inside the component
const form = reactive<DeviceFormFields>({
  deviceType: 'cisco_ios',
  host: '',
  port: 22,
  username: '',
  password: '',
  secret: ''
});

function handleSubmit() {
  // Emit a shallow copy of the state so parent mutations won't leak backwards
  emit('submit', { ...form });
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="device-form">
    <div class="form-group">
      <select v-model="form.deviceType" id="deviceType">
        <option value="cisco_ios">Cisco IOS</option>
      </select>
    </div>
    
    <div class="form-group">
      <input v-model="form.host" id="host" placeholder="Host" required />
    </div>

    <div class="form-group">
      <input v-model.number="form.port" id="port" type="number" placeholder="Port" required />
    </div>

    <div class="form-group">
      <input v-model="form.username" id="username" placeholder="Username" required />
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
.form-group input, .form-group select {
  padding: 0.35rem;
}
</style>
