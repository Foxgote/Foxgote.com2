<script setup>
import { ref, watch } from "vue"

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
})

const animate = ref(false)

function replay() {
  animate.value = false
  requestAnimationFrame(() => {
    animate.value = true
  })
}

watch(
  () => props.text,
  () => {
    replay()
  },
  { immediate: true },
)

defineExpose({ replay })
</script>

<template>
  <p :class="['translating-line', { 'is-animating': animate }]">
    {{ text }}
  </p>
</template>

<style scoped>
.translating-line {
  margin: 0;
  border: 1px solid rgba(170, 200, 235, 0.34);
  border-radius: 10px;
  background: rgba(7, 12, 17, 0.88);
  color: rgba(232, 243, 255, 0.94);
  padding: 0.8rem 0.95rem;
  min-height: 44px;
  line-height: 1.4;
  word-break: break-word;
}

.is-animating {
  animation: line-fade-in 280ms ease-out;
}

@keyframes line-fade-in {
  from {
    opacity: 0.2;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
