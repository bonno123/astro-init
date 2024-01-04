<template>
    <div class="tres-container"> 
        <TresCanvas v-bind="gl">

            <TresPerspectiveCamera :args="[45, 1, 0.1, 1000]" />
            <!-- <primitive :object="meshWithMaterial" /> -->

            <TresMesh
                ref="boxRef"
                :scale="1"
            >
                <TresBoxGeometry :args="[1, 1, 1]" />
                <TresMeshNormalMaterial />
            </TresMesh>
        </TresCanvas>
    </div>
</template>

<script setup lang="ts">
import { TresCanvas, useRenderLoop } from '@tresjs/core';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three';
import type { RendererElement } from 'vue';
import { shallowRef, type ShallowRef } from 'vue';

const { onLoop } = useRenderLoop()

const boxRef: ShallowRef<RendererElement | null> = shallowRef(null)

const gl = {
    clearColor: '#181C3E',
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
};


onLoop(({ delta, elapsed }) => {
  if (boxRef.value) {
    boxRef.value.rotation.y += delta
    boxRef.value.rotation.z = elapsed * 0.2
  }
})


</script>

<style scoped>
.tres-container {
    width: 100%;
    height: 400px;
}

canvas {
    width: 100%;
    height: 100%;
}

</style>





