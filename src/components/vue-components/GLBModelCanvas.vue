<template>
<TresCanvas class="" v-bind="gl">
    <TresDirectionalLight :position="[0, 2, 4]" :intensity="4" :color="((Color.NAMES.blanchedalmond) as unknown as Color)" cast-shadow />
    
    <TresDirectionalLight :position="[2, 2, 0]" :intensity="5" cast-shadow />

    <TresPerspectiveCamera 
        :position="[0, 5, 5]"
    />

    <TresMesh
        ref="boxRef"
        :scale="1"
    >
        <OrbitControls shadows alpha />

        <suspense>
            <Suzanne />
        </suspense>

    </TresMesh>

    <TresPointLight 
        :color="((Color.NAMES.sienna) as unknown as Color)" 
        :intensity="8" 
        :look-at="0" 
    /> 

    <TresGridHelper />
    <Stars />
</TresCanvas>
</template>

<script lang="ts" setup>
import { TresCanvas, useRenderLoop  } from '@tresjs/core';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Color } from 'three';
import { shallowRef, type ShallowRef, type RendererElement } from 'vue';
import { OrbitControls, Stars } from '@tresjs/cientos';
import Suzanne from './Suzanne.vue';

const { onLoop } = useRenderLoop()

const gl = {
    clearColor: '#000',
    shadows: true,
    alpha: false,
    shadowMapType: BasicShadowMap,
    outputColorSpace: SRGBColorSpace,
    toneMapping: NoToneMapping,
    antialias: true,
    depth: true,
    stencil: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'default',
    failIfMajorPerformanceCaveat: false,
    // desynchronized: false,
    // xrCompatible: false,
} satisfies InstanceType< typeof TresCanvas>['$props'];;

const boxRef: ShallowRef<RendererElement | null> = shallowRef(null)

const startAnimateBox = function () {
    onLoop(({ delta, elapsed }) => {
        if (boxRef.value) {
            boxRef.value.rotation.y += delta * 0.05
            boxRef.value.rotation.z = elapsed * -0.05
        }
    })
}

startAnimateBox()
</script>

<style>

/* .canvas {
    width: 100%;
    aspect-ratio: 1;
} */

</style>