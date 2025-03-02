<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2vh;
  position: relative;
  align-items: center;
  color: black;
}

h3 {
  font-size: 1vh;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}
</style>
