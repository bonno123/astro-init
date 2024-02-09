<template>
    <div class="tres-container">
        <TresCanvas v-bind="gl" v-if="0">
            <TresPerspectiveCamera :args="[45, 1, 0.1, 1000]"  />

            <TresMesh
                ref="boxRef"
                :scale="1"
            >
                <TresSphereGeometry :args="[1, 32, 16]" />

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

            <TresAmbientLight :color="(Color.NAMES['blueviolet'] as unknown as Color)" /> 

            <TresDirectionalLight :position="[0, 2, 4]" :intensity="2" cast-shadow />

            <Stars />
        </TresCanvas>

        <TresCanvas v-bind="gl" v-if="1">
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

            <TresPointLight :color="((Color.NAMES.sienna) as unknown as Color)" :intensity="8" :look-at="0" /> 

            <Stars />
        </TresCanvas>
    </div>
</template>

<script setup lang="ts">
import { TresCanvas, useRenderLoop, useTexture  } from '@tresjs/core';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Color } from 'three';
import type { RendererElement } from 'vue';
import { shallowRef, type ShallowRef } from 'vue';
import { OrbitControls, Lensflare, Stars } from '@tresjs/cientos';
import Suzanne from './Suzanne.vue';
import type { TresCanvasProps } from '@tresjs/core/dist/src/components/TresCanvas.vue.js';

const { onLoop } = useRenderLoop()

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





