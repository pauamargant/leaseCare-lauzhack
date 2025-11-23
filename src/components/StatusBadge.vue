<template>
  <span :class="badgeClass">
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: 'clean' | 'warning' | 'risk';
}>();

const badgeClass = computed(() => {
  const baseClass = 'px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border';
  const styles = {
    clean: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    risk: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return `${baseClass} ${styles[props.status]}`;
});
</script>
