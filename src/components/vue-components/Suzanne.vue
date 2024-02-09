<template>
    <primitive :object="model"></primitive>
</template>

<script lang="ts" setup>
import { useGLTF } from '@tresjs/cientos';

const { nodes } = await useGLTF('/monkey.glb', {draco: true});

const model = nodes.Suzanne;

</script>