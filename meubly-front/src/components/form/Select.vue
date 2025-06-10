<template>
  <div class="form-group">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>
    <div class="custom-select">
      <select
        :id="id"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="select-input"
        :required="required"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option 
          v-for="option in options" 
          :key="option.value" 
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Select',
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: 'Sélectionnez une option'
    }
  },
  emits: ['update:modelValue']
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1.5rem;
}

.custom-select {
  position: relative;
  width: 100%;
}

.select-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
  appearance: none;
  cursor: pointer;
  font-size: 1rem;
  color: #374151;
  transition: all 0.2s ease;
}

.select-input:focus {
  outline: none;
  border-color: #B88E2F;
  box-shadow: 0 0 0 2px rgba(184, 142, 47, 0.2);
}

.custom-select::after {
  content: '';
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #6b7280;
  pointer-events: none;
}

.select-input:hover {
  border-color: #B88E2F;
}

.select-input option {
  padding: 0.5rem;
}

.select-input option:checked {
  background-color: #B88E2F;
  color: white;
}
</style> 