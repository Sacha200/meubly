<template>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-[#3A3A3A] dark:text-white mb-1">Prix min</label>
        <input
          type="number" min="0"
          class="w-full rounded-xl border border-[#DBDBDB] dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B88E2F] dark:focus:ring-[#B88E2F]"
          :value="min"
          @input="onMin"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-[#3A3A3A] dark:text-white mb-1">Prix max</label>
        <input
          type="number" min="0"
          class="w-full rounded-xl border border-[#DBDBDB] dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B88E2F] dark:focus:ring-[#B88E2F]"
          :value="max"
          @input="onMax"
        >
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PriceFilter',
    props: {
      min: { type: [Number, null], default: null },
      max: { type: [Number, null], default: null }
    },
    emits: ['update:min', 'update:max'],
    setup(props, { emit }) {
      const onMin = (e) => {
        const v = e.target.value
        emit('update:min', v !== '' ? Number(v) : null)
      }
      const onMax = (e) => {
        const v = e.target.value
        emit('update:max', v !== '' ? Number(v) : null)
      }
      return { onMin, onMax }
    }
  }
  </script>
  