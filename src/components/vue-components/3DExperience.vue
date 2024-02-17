<template>
    <div class="tres-container" :class="containerClass">
        <GLBModelCanvas :class="canvasClass"/>
    </div>
</template>

<script setup lang="ts">
import GLBModelCanvas from '~/components/vue-components/GLBModelCanvas.vue'

defineProps<{
    canvasClass?: string;
    containerClass?: string;

}>()

</script>

<style scoped>
.tres-container {
    /* width: 100%; */
    height: 20rem;
    /* aspect-ratio: 1; */
}

</style>





