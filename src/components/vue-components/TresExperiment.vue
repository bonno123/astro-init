<template>
    <div class="tres-container">
        <TresCanvas v-bind="gl">
            <TresPerspectiveCamera :args="[45, 1, 0.1, 1000]"  />

            <TresMesh
                ref="boxRef"
                :scale="1"
            >
                <!-- <TresBoxGeometry :args="[1.5, 1.5, 1.5]" /> -->
                <TresIcosahedronGeometry :args="[1, 4]" />

                <TresMeshStandardMaterial
                    v-bind="pbrTexture"
                    :displacement-scale="0.1"
                />

                <OrbitControls shadows alpha />

            </TresMesh>

            <TresPointLight>
                <Lensflare 
                    :elements="[{ color: 'red' }, { color: 'yellow' }]" 
                    :seed="5" 
                />
            </TresPointLight>
            <TresDirectionalLight :position="[0, 2, 4]" :intensity="1.2" cast-shadow />
            <TresAmbientLight :color="(Color.NAMES['blueviolet'] as unknown as Color)" /> 
            <TresDirectionalLight :position="[0, 2, 4]" :intensity="2" cast-shadow />


            <Stars></Stars>

            <!-- <TresGridHelper /> -->
        </TresCanvas>
    </div>
</template>

<script setup lang="ts">
import { TresCanvas, useLoader, useRenderLoop, useTexture  } from '@tresjs/core';
import type { TresCanvasProps } from '@tresjs/core/dist/components/TresCanvas.vue.js';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Color } from 'three';
import type { RendererElement } from 'vue';
import { shallowRef, type ShallowRef } from 'vue';
import { OrbitControls, Lensflare, Stars } from '@tresjs/cientos';

const { onLoop } = useRenderLoop()

// const pbrTexture = await useTexture({
//   map: 'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_Displacement.jpg',
//   displacementMap:
//     'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_Displacement.jpg',
//   roughnessMap:
//     'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_Roughness.jpg',
//   normalMap:
//     'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_NormalGL.jpg',
//   ambientOcclusion:
//     'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_AmbientOcclusion.jpg',
// });

const pbrTexture = await useTexture({
  map: '/earthbump1k.jpg',
  displacementMap:
    'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_Displacement.jpg',
  roughnessMap:
    'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_Roughness.jpg',
  normalMap:
    'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_NormalGL.jpg',
  ambientOcclusion:
    'https://raw.githubusercontent.com/Tresjs/assets/main/textures/black-rock/Rock035_2K_AmbientOcclusion.jpg',
});

const boxRef: ShallowRef<RendererElement | null> = shallowRef(null)
// const pointLightRef: ShallowRef<RendererElement | null> = shallowRef(null)

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
} satisfies TresCanvasProps;


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

<style scoped>
.tres-container {
    width: 100%;
    height: 350px;
    aspect-ratio: 1;
}

canvas {
    width: 100%;
    aspect-ratio: 1;
}

</style>





