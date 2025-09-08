<template>
    <div class="w-full">
      <label class="block text-sm font-medium text-[#3A3A3A] dark:text-white mb-1">Catégorie</label>
      <select
        class="w-full rounded-xl border border-[#DBDBDB] dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B88E2F] dark:focus:ring-[#B88E2F]"
        :value="modelValue"
        @change="onChange"
      >
        <option :value="''">Toutes</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>
  </template>
  
  <script>
  import { onMounted, computed } from 'vue'
  import { useCategoryStore } from '@/stores/categoryStore'
  
  export default {
    name: 'CategoryFilter',
    props: {
      modelValue: { type: [Number, String, null], default: null }
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const cat = useCategoryStore()
  
      onMounted(() => {
        if (!cat.categories.length) cat.fetchCategories()
      })
  
      const options = computed(() =>
        cat.categories.map(c => ({ label: c.title, value: c.category_id }))
      )
  
      const onChange = (e) => {
        const v = e.target.value
        emit('update:modelValue', v ? Number(v) : null)
      }
  
      return { options, onChange }
    }
  }
  </script>
  