<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-btn" @click="close">×</button>
      
      <div class="auth-tabs">
        <button 
          :class="{ active: mode === 'login' }" 
          @click="mode = 'login'"
        >Login</button>
        <button 
          :class="{ active: mode === 'register' }" 
          @click="mode = 'register'"
        >Register</button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <h2 class="auth-title">{{ mode === 'login' ? 'Welcome Back' : 'Create Account' }}</h2>
        
        <div v-if="mode === 'register'" class="form-group">
          <label>Full Name</label>
          <input v-model="form.name" type="text" placeholder="John Doe" required />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="you@example.com" required />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" placeholder="••••••••" required />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Sign Up') }}
        </button>

        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useEditorStore } from '@/stores/editor'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const store = useEditorStore()
const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: '',
  name: ''
})

const close = () => {
  emit('close')
  error.value = ''
  form.email = ''
  form.password = ''
  form.name = ''
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (mode.value === 'login') {
      await store.login(form.email, form.password)
    } else {
      await store.register(form.email, form.password, form.name)
    }
    close()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Authentication failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  padding: 24px;
  position: relative;
  box-shadow: var(--shadow-xl);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.auth-tabs button {
  flex: 1;
  background: none;
  border: none;
  padding: 12px;
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: 500;
  position: relative;
}

.auth-tabs button.active {
  color: var(--text-primary);
  font-weight: 600;
}

.auth-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary);
}

.auth-title {
  text-align: center;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

input {
  width: 100%;
  padding: 10px;
  background: var(--bg-canvas);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

input:focus {
  outline: none;
  border-color: var(--primary);
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
  text-align: center;
  margin-top: 12px;
}
</style>
