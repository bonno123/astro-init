<template>
    <div class="tres-container">
        <TresCanvas v-bind="gl">
            <TresPerspectiveCamera :args="[45, 1, 0.1, 1000]" />
            <!-- <primitive :object="meshWithMaterial" /> -->

            <TresMesh
                ref="boxRef"
                :scale="1"
            >
                <TresBoxGeometry :args="[2, 2, 2]" />
                <TresMeshNormalMaterial />
            </TresMesh>
        </TresCanvas>
    </div>
</template>

<script setup lang="ts">
import { TresCanvas, useRenderLoop } from '@tresjs/core';
import type { TresCanvasProps } from '@tresjs/core/dist/components/TresCanvas.vue.js';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three';
import type { RendererElement } from 'vue';
import { shallowRef, type ShallowRef } from 'vue';

const { onLoop } = useRenderLoop()

const boxRef: ShallowRef<RendererElement | null> = shallowRef(null)

const gl = {
    clearColor: '#FFF',
    shadows: true,
    alpha: false,
    shadowMapType: BasicShadowMap,
    outputColorSpace: SRGBColorSpace,
    toneMapping: NoToneMapping,
    // antialias: true,
    // depth: true,
    // stencil: true,
    // premultipliedAlpha: true,
    // preserveDrawingBuffer: false,
    // powerPreference: 'default',
    // failIfMajorPerformanceCaveat: false,
    // desynchronized: false,
    // xrCompatible: false,
} satisfies TresCanvasProps;


const startAnimateBox = function () {
    onLoop(({ delta, elapsed }) => {
        if (boxRef.value) {
            boxRef.value.rotation.y += delta
            boxRef.value.rotation.z = elapsed * 0.2
        }
    })
}

startAnimateBox()


</script>

<style scoped>
.tres-container {
    width: 100%;
    height: 350px;
    /* aspect-ratio: 1; */
}

canvas {
    width: 100%;
    aspect-ratio: 1;
}

</style>





