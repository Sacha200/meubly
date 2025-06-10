<template>
  <div class="form-group">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>
    <textarea
      :id="id"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="form-input"
      :rows="rows"
      :required="required"
      :placeholder="placeholder"
    ></textarea>
  </div>
</template>

<script>
export default {
  name: 'TextArea',
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
      type: String,
      default: ''
    },
    rows: {
      type: Number,
      default: 4
    },
    required: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue']
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 1rem;
  color: #374151;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 100px;
}

.form-input:focus {
  outline: none;
  border-color: #B88E2F;
  box-shadow: 0 0 0 2px rgba(184, 142, 47, 0.2);
}

.form-input:hover {
  border-color: #B88E2F;
}
</style> 