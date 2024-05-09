<!-- @following: https://codepen.io/halavasty/pen/abXGRvd?editors=0010 -->
<template>
  <div class="" style="display: inline;">
    <div class="scratch-card">
        <div ref="scratchCardCoverContainer" class="scratch-card-cover-container">
            <canvas
              ref="canvas" 
              class="scratch-card-canvas" 
              width="200" 
              height="100"
              @pointerdown="onCanvasPointerDown"
            ></canvas>
            <!-- only needed for Safari and iOS browsers -->
            <img ref="scratchCardCanvasRender" class="scratch-card-canvas-render hidden" alt="">

            <div ref="scratchCardCover" class="scratch-card-cover shine">
                <svg class="scratch-card-cover-background"
                  data-name="Layer 1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 34.11 5.2"
                >
                  <path
                    d="M23.9,6.49s-.06,0-.06.06l.06,0A.06.06,0,0,0,24,6.51S23.93,6.48,23.9,6.49Z"
                    transform="translate(-3.42 -1.5)"
                  />
  
                  <path
                    d="M10.7,3c-.07.06.06.07.21,0l.15-.05H10.9A.49.49,0,0,0,10.7,3Z"
                    transform="translate(-3.42 -1.5)"
                  />
  
                  <path
                    d="M23.5,6.6c-.25,0-.28,0-.25,0s0-.08,0-.08A.39.39,0,0,1,23,6.41a.48.48,0,0,0-.24-.08c-.12,0-.16,0-.19.09s-.06.09-.1.08-.06,0-.06,0,0,.07.68.16c.4,0,.74,0,.68,0A.77.77,0,0,0,23.5,6.6Z"
                    transform="translate(-3.42 -1.5)"
                  />
  
                  <path d="M34.21,4.55c-.07.06-.05.07.14.07s.18,0,.18,0S34.27,4.5,34.21,4.55Z"
                    transform="translate(-3.42 -1.5)"
                  />
  
                  <path
                    d="M22.83,3.67a.13.13,0,0,0,.11,0s0,0,0,0S22.81,3.66,22.83,3.67Z"
                    transform="translate(-3.42 -1.5)"
                  />
  
                  <path
                    d="M29,3.48c-.06,0-.12,0-.12.08s.05,0,.1,0a.49.49,0,0,1,.15,0s.05,0,0,0A.24.24,0,0,0,29,3.48Z"
                    transform="translate(-3.42 -1.5)"
                  />
  
                  <path
                    d="M37.39,3.93a2.11,2.11,0,0,0-1-.4c-.07,0-.1,0-.1-.1a.16.16,0,0,0-.1-.16L36,3.18c-.16-.06-.18-.06-.2,0s0,.12.12.17.13.09.11.1a2,2,0,0,1-.48,0c-.25,0-.39,0-.32,0,.24,0,.13-.17-.22-.26a7,7,0,0,0-.88-.12l-.91,0-.45,0a6,6,0,0,0-.79,0L30.6,2.94l-1.23,0c-.34,0-.91-.05-1.27-.08l-.94-.07a1.62,1.62,0,0,1-.38,0,.86.86,0,0,0-.33,0,.55.55,0,0,1-.28,0,7,7,0,0,0-1.43-.12c-1.14,0-2.58-.09-3.5-.17-.32,0-.9-.06-1.3-.07s-.81,0-.9-.05-1.35-.08-2.63-.1c-.55,0-1.27,0-1.6-.06l-1.67,0C10.56,2,9.11,2,8.83,2A2.85,2.85,0,0,0,7.61,2,.41.41,0,0,1,7.3,2a6.21,6.21,0,0,0-.68,0L6,1.93H5.55c-.35,0-.68-.07-.68-.18a.07.07,0,0,1,.07-.06s0,0,0,0a.23.23,0,0,0-.15.05c-.09.07-.12.07-.22,0s-.22-.09-.22,0-.07.13-.18.07-.06-.05,0-.11,0-.18-.09-.18S4,1.56,4,1.67s-.06.06-.15.07a.28.28,0,0,0-.19.05A.69.69,0,0,1,3.54,2c-.1.1-.1.12,0,.22s.11.3,0,.34-.1.21.13.32.21.11.18.31,0,.22.11.27.13.08.11.14.3.39.65.6c.08,0,.11.07.07,0s-.17.13-.07.18a.91.91,0,0,0,.27,0c.23,0,.37.19.27.34s-.08.14.14.19.19.06.18.17,0,.13.12.16a1.51,1.51,0,0,1,.59.24.26.26,0,0,0,.16.07,1.24,1.24,0,0,1,.38.22c.32.24.52.28.7.12s.33-.14.2,0,0,.18.37.13a3.44,3.44,0,0,1,.85,0c.36,0,.69,0,.69-.12s.3-.14,1.07-.14c.45,0,.66,0,.69.06S11.69,6,12,6c.65,0,.89,0,.93-.06s.09,0,.22,0a5.06,5.06,0,0,0,1.47.1.57.57,0,0,1,.37,0,4.44,4.44,0,0,0,.56.08l.86.07c.84.07,1.12.06,1.2,0s.15-.08.52-.08a9.29,9.29,0,0,0,1.73,0,.22.22,0,0,1,.17,0,1.35,1.35,0,0,0,.4.1c.31.06.37,0,.51,0a.68.68,0,0,1,.45-.05c.16,0,.29,0,.29,0s.21-.09.58,0l.81.07a5.21,5.21,0,0,1,.55,0c.13,0,1.77.14,2.9.18a2,2,0,0,0,.75,0,.31.31,0,0,1,.26,0,1.8,1.8,0,0,0,.7.12,1.09,1.09,0,0,1,.33,0,5.09,5.09,0,0,0,1.46,0l.54-.07.46,0c.13,0,.43,0,.66,0,.44,0,.72-.1.83-.26A.15.15,0,0,1,32.69,6a.1.1,0,0,0,.12,0s0,0-.91-.07l-1.11,0h-.7c-.19,0-.14-.08.1-.22a1.06,1.06,0,0,1,.72-.11c.08,0,1.35.07,2.79.1a2.86,2.86,0,0,1,.62,0,.53.53,0,0,0,.52-.07l.14-.1-.15,0a1.11,1.11,0,0,1-.29-.1c-.09,0-.15,0-.18,0s-.31.11-.54,0-.24-.16-.34-.12a.15.15,0,0,1-.18,0s0,0,.06,0A2.06,2.06,0,0,0,33.7,5a.85.85,0,0,1,.59,0,9.6,9.6,0,0,0,1.3.07c.32,0,.46,0,.42-.05a.26.26,0,0,0-.18,0,.34.34,0,0,1-.18,0,1.17,1.17,0,0,0-.4-.11.84.84,0,0,1-.4-.13.6.6,0,0,0-.46,0,3.54,3.54,0,0,1-.9,0c-.13,0-.16,0-.11-.08S33,4.59,32,4.63c-.3,0-.45,0-.45-.08s-.19-.1-.28,0a1,1,0,0,1-.69,0c0-.06-.07-.06-.17,0s-.31.08-.31,0-.06,0-.12,0-.11,0-.09,0a9.62,9.62,0,0,0-1.68-.12.87.87,0,0,1-.28,0,.84.84,0,0,1,.32-.2s0,0,0,0a.28.28,0,0,0-.16,0A3.32,3.32,0,0,1,27,4.15a2.21,2.21,0,0,0-.4-.05c-.37,0-.47-.08-.21-.16s.18-.16-.31-.17c-.25,0-.55,0-.68,0s-.23,0-.26,0a.1.1,0,0,0,.06.14s.08.08.06.09a.86.86,0,0,1-.5,0,.15.15,0,0,0-.16,0c-.09.06-.18,0-.12-.1s-.26,0-.37,0A.1.1,0,0,1,24,4a1.3,1.3,0,0,0-.38,0,12.33,12.33,0,0,1-1.41-.1s0-.06,0-.1a.11.11,0,0,0-.08-.1.06.06,0,0,0-.07.06c0,.05,0,.07-.09.06s-.08,0-.05,0,0,.07-.15,0-.19,0-.22,0a.17.17,0,0,1-.13.08c-.07,0-.09,0-.07-.08s-.23-.14-.5,0-.66.1-.71,0-.11-.08-.23-.08a1.27,1.27,0,0,1-.38-.07.71.71,0,0,0-.37,0c-.17,0-.19,0-.19-.08A.22.22,0,0,1,19,3.37c.11-.09,0-.17-.13-.11a.85.85,0,0,1-.22,0c-.24,0-.32,0-.32.11s-.14.1-.17,0,.07-.1.2-.15a1,1,0,0,0,.25-.14c.07-.09-.66,0-.74.08a.29.29,0,0,1-.11.08c-.07,0-.2.14-.28.28s-.22.13-.23-.09,0-.2,0-.2l.22,0c.2,0,.24,0,.18-.12s-.12,0-.29,0a8.77,8.77,0,0,1-1.67,0s-.08,0-.19,0-.3-.07-.13-.13,1.29-.08,1.8-.08a1,1,0,0,0,.41-.12,1,1,0,0,1,.43-.14,1,1,0,0,0,.27-.05.56.56,0,0,1,.24,0,.51.51,0,0,0,.23,0,.08.08,0,0,1,.11,0c0,.05,0,.07-.1.07a.48.48,0,0,0-.22,0c-.06,0,0,.05.09.07l.2,0s.07,0,.11-.11.07-.1.07,0,.24.13.33.06.2,0,.85-.09a3,3,0,0,0,.56-.08.21.21,0,0,1,.24,0,1.62,1.62,0,0,0,.68.07,6,6,0,0,1,.94.07,5.57,5.57,0,0,0,.6.07l.64.09a4.59,4.59,0,0,0,.72,0,3.06,3.06,0,0,1,.91,0,1,1,0,0,0,.35,0,.82.82,0,0,1,.35,0c.05,0,.27,0,.27,0s.18-.06.3,0A4,4,0,0,0,28,3.1l1.36,0a1.48,1.48,0,0,1,.43.05A9.42,9.42,0,0,0,31,3.26a13.89,13.89,0,0,1,2,.06l.44.06a.78.78,0,0,1,.35.07,2.55,2.55,0,0,1-1.26,0c0-.08-.19-.07-.19,0s-.09.1-.19.13c-.34.13-.22.18.39.2a1.45,1.45,0,0,1,.44.06c0,.07-.58.09-.75,0s-.44,0-.44.08.07.07.24.07.25,0,.25,0,.12,0,.3,0,.3,0,.3,0,.09,0,.29,0l.3,0c.06,0,.1,0,.11.05s.08.06.26,0,.24,0,.22,0,.15.06.34,0,.17-.07.15,0,.69.51.76.42.27-.07,1.12,0c.27,0,.32,0,.39-.08s.1-.1.13-.1l.28-.08C37.56,4.32,37.62,4.12,37.39,3.93ZM3.81,2c-.05,0-.09,0-.09-.05a.06.06,0,0,1,.06-.05.12.12,0,0,1,.09.05S3.87,2,3.81,2Zm4.66.41c0-.06-.1-.07-.37,0-.58,0-.38,0,.29-.1.28,0,.28,0,.28.1S8.53,2.53,8.47,2.4ZM30.71,5c.14,0,.25,0,.23,0a1.26,1.26,0,0,1,.45,0c.4,0,.47,0,.41.07a.27.27,0,0,1-.18,0,.92.92,0,0,0-.31,0,4.31,4.31,0,0,1-.63,0,1.58,1.58,0,0,1-.47,0C30.15,5,30.45,5,30.71,5Zm-2.52-.06c.08,0,.11,0,.07,0a.19.19,0,0,1-.15,0S28.1,4.92,28.19,4.92ZM26,5.4a.19.19,0,0,1-.14,0c-.09,0,0-.09.11-.09S26.08,5.36,26,5.4ZM25.85,4c.15,0,.28,0,.28,0a.76.76,0,0,1-.33,0,1.46,1.46,0,0,1-.33,0S25.46,4,25.85,4ZM24.69,5c.2,0,.21,0,.06.19a.23.23,0,0,1-.21.09c-.05,0-.09,0-.09-.07S24.53,5,24.69,5Zm-.51.21s0,0-.1.08-.12,0-.12,0S24.13,5.13,24.18,5.17ZM22.23,5a.6.6,0,0,1,.24,0s0,0-.11.07a.62.62,0,0,1-.24,0S22.13,5,22.23,5ZM15.8,3.45A.18.18,0,0,0,16,3.38a.16.16,0,0,1,.29,0,.23.23,0,0,1,0,.15,1,1,0,0,1-.46,0h0C15.65,3.53,15.66,3.45,15.8,3.45ZM13.93,2.38a.12.12,0,0,1,.09.05s0,0-.06,0-.09,0-.09,0A.06.06,0,0,1,13.93,2.38Zm-.48-.07c.17,0,.23,0,.26,0s0,.08-.3.08C13,2.43,13,2.37,13.45,2.31Zm-.58,0a.17.17,0,0,1,.13,0s0,.05-.09.05S12.75,2.4,12.87,2.36Zm-.43,1a.18.18,0,0,1-.14,0c-.09,0,0-.09.11-.09S12.49,3.32,12.44,3.36Zm.33,0c-.11,0-.15-.1-.07-.16s.18,0,.18.07S12.84,3.35,12.77,3.35Zm.53-.21c-.09,0-.16,0-.16.07a0,0,0,0,1-.05,0s-.07,0-.09-.08.13-.17.32-.17S13.48,3.1,13.3,3.14Zm2.43-.56a.15.15,0,0,0-.14.13.27.27,0,0,1,0,.13l-.76.05-.82,0c-.12,0-.15,0-.05-.1a.13.13,0,0,0,.06-.1c0-.05,0-.05-.17,0a.63.63,0,0,1-.23,0,.42.42,0,0,0-.2.06,3.61,3.61,0,0,1-.85.08l-.8,0c-.18,0-.08.1.14.13s.2,0,.06.06A1,1,0,0,1,11.29,3c0-.1-.12-.08-.16,0s-.06.1-.14.08a1,1,0,0,0-.4,0c-.28.07-.39,0-.29,0s-.21-.34-.3-.3-.06,0-.06-.07,0-.1-.12-.07-.12,0-.12,0,0,0-.1,0c-.3.07-.5.08-.5,0s.05-.06.12-.07.16-.16.06-.21a.19.19,0,0,0-.16,0s-.09,0-.1,0a.88.88,0,0,0-.1-.1c-.07-.07-.05-.09.1-.12a7.48,7.48,0,0,1,1.56,0,1,1,0,0,1,.27.06,4,4,0,0,1-.92,0,.49.49,0,0,0-.43.13s0,0,.16,0a6.5,6.5,0,0,1,.86,0c.7,0,.9,0,.84-.09a.16.16,0,0,0-.12,0,.41.41,0,0,1-.19,0c-.08,0-.06,0,.1-.09s.74-.09.61,0-.09.06,0,.1.21.06.43,0,.2-.08.33.05.13.17.11.22,0,.1.14.14.36,0,.68-.15a.4.4,0,0,1,.36,0,1.91,1.91,0,0,0,1,0,.12.12,0,0,1,.09-.07s0,0,0,.07,0,.07.05.07l.21,0c.1,0,.14,0,.14,0s.36-.17.48-.11S15.87,2.57,15.73,2.58Zm1.52.07c0,.05,0,.06-.1,0l-.32-.12c-.15-.06-.18-.09-.12-.11a1.07,1.07,0,0,1,.55.09A.34.34,0,0,0,17.25,2.65Z"
                    transform="translate(-3.42 -1.5)"
                  />
  
                  <path
                    d="M9.8,5.94c-.07,0-.1,0-.09,0a.2.2,0,0,0,.14.08c.07,0,.1,0,.08-.05A.24.24,0,0,0,9.8,5.94Z"
                    transform="translate(-3.42 -1.5)"
                  />
  
                  <path
                    d="M10.89,5.89c-.11,0-.11,0,0,0s.18.06.18,0S11,5.88,10.89,5.89Z"
                    transform="translate(-3.42 -1.5)"
                  />
                </svg>
            </div>
        </div>
  
        <div ref="scratchCardContent" class="scratch-card-content fw-bold text-accent">
            <span :class=" { 'blurry-text': !isScratchCompleted } ">
                {{ hiddenTextCharacters }}
            </span>
          </div>
    </div>
  
    <svg width="0" height="0">
        <filter id="remove-black" color-interpolation-filters="sRGB">
            <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    -1 -1 -1 0 1"
            result="black-pixels"
            />
            <feComposite in="SourceGraphic" in2="black-pixels" operator="out" />
        </filter>
  
        <filter id="noise">
            <feTurbulence baseFrequency="0.7"></feTurbulence>
        </filter>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';

let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const scratchCardCover = ref<HTMLDivElement | null>(null);
const scratchCardCanvasRender = ref<HTMLImageElement | null>(null);
const scratchCardCoverContainer = ref<HTMLDivElement | null>(null);

const scratchCardText = ref<HTMLParagraphElement | null>(null);
const scratchCardContent = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const isScratchCompleted = ref(false);

let context : CanvasRenderingContext2D | null | undefined;

let positionX: number;
let positionY: number;
let clearDetectionTimeout: number | null = null;

const hiddenTextCharacters = ref(new Array(import.meta.env.PUBLIC_CONTACT_EMAIL.length).fill('•').join(''));

let devicePixelRatio: number;
let canvasWidth = 0;
let canvasHeight = 0;

const getPosition = (
  { clientX, clientY } : { clientX: number; clientY: number; }
) => {
  const { left, top } = canvas.value?.getBoundingClientRect()!;
  return {
    x: clientX - left,
    y: clientY - top,
  };
}

const checkBlackFillPercentage = () => {
  console.log('checking... BlackFillPercentage');
  
  const imageData = context?.getImageData(0, 0, canvasWidth, canvasHeight);
  const pixelData = imageData?.data;

  let blackPixelCount = 0;

  if (!pixelData) {
    return;
  }

  for (let i = 0; i < pixelData.length; i += 4) {
    const red = pixelData[i];
    const green = pixelData[i + 1];
    const blue = pixelData[i + 2];
    const alpha = pixelData[i + 3];

    if (red === 0 && green === 0 && blue === 0 && alpha === 255) {
      blackPixelCount++;
    }
  }

  const blackFillPercentage = blackPixelCount * 100 / (canvasWidth * canvasHeight);
 
  if (blackFillPercentage >= 45) {
    scratchCardCoverContainer.value?.classList.add('clear');
    isScratchCompleted.value = true;

    // confetti({
    //   particleCount: 100,
    //   spread: 90,
    //   origin: {
    //      y: (scratchCardText.getBoundingClientRect().bottom + 60) / window.innerHeight,
    //   },
    // });

    // if (scratchCardText.value) {
    //   scratchCardText.value.textContent = import.meta.env.PUBLIC_CONTACT_EMAIL;
    //   scratchCardContent.value?.classList.add('animate');
    //   scratchCardCoverContainer.value?.addEventListener('transitionend', () => {
    //     scratchCardCoverContainer.value?.classList.add('hidden');
    //   }, { once: true });
    // }

    // scratchCardText.value.textContent = import.meta.env.PUBLIC_CONTACT_EMAIL;
    // hiddenTextContent.value = import.meta.env.PUBLIC_CONTACT_EMAIL;
    scratchCardContent.value?.classList.add('animate');
    scratchCardCoverContainer.value?.addEventListener('transitionend', () => {
      scratchCardCoverContainer.value?.classList.add('hidden');
    }, { once: true });
  }
}

const plotLine = (
  context: CanvasRenderingContext2D | null | undefined, 
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
) => {
  var diffX = Math.abs(x2 - x1);
  var diffY = Math.abs(y2 - y1);
  var dist = Math.sqrt(diffX * diffX + diffY * diffY);
  var step = dist / 50;
  var i = 0;
  var t;
  var x;
  var y;

  while (i < dist) {
   
    t = Math.min(1, i / dist);

    x = x1 + (x2 - x1) * t;
    y = y1 + (y2 - y1) * t;

    context?.beginPath();
    context?.arc(x, y, 12, 0, Math.PI * 2);
    context?.fill();

    i += step;
  }
}

const setImageFromCanvas = () => {
  canvas.value?.toBlob((blob) => {
    let previousUrl;
    const url = URL.createObjectURL(blob!);
    if (scratchCardCanvasRender.value?.src) {
      previousUrl = scratchCardCanvasRender.value?.src;
      scratchCardCanvasRender.value.src = url;
      if (!previousUrl) {
        scratchCardCanvasRender.value?.classList.remove('hidden');
      } else {
        URL.revokeObjectURL(previousUrl);
      }
      previousUrl = url;
    }
  });
}

let setImageTimeout: number;

const plot = (e: { clientX: any; clientY: any; }) => {
  // console.log('plot');
  
  const { x, y } = getPosition(e);
  
  plotLine(context, positionX, positionY, x, y);
  positionX = x;
  positionY = y;
  if (isSafari) {
    clearTimeout(setImageTimeout);

    setImageTimeout = setTimeout(() => {
      setImageFromCanvas();
    }, 5);
  }
};

function onCanvasPointerDown(e: any) {
  hiddenTextCharacters.value = import.meta.env.PUBLIC_CONTACT_EMAIL;

  scratchCardCover.value?.classList.remove('shine');

  ({ x: positionX, y: positionY } = getPosition(e)); 

  if (clearDetectionTimeout){
    clearTimeout(clearDetectionTimeout);
  }

  
  canvas.value?.addEventListener('pointermove', plot);
  
  window.addEventListener('pointerup', (e) => {
    canvas.value?.removeEventListener('pointermove', plot);
    clearDetectionTimeout = setTimeout(() => {
      checkBlackFillPercentage();
    }, 500);
  }, { once: true });
}

onMounted(() => {
  devicePixelRatio = window.devicePixelRatio || 1;
  canvasWidth = (canvas.value?.offsetWidth ?? 0) * devicePixelRatio;
  canvasHeight = (canvas.value?.offsetHeight ?? 0) * devicePixelRatio;

  if (canvas.value !== null) {
    canvas.value.width = canvasWidth;
    canvas.value.height = canvasHeight;
  }
  context = canvas.value?.getContext('2d')

  context?.scale(devicePixelRatio, devicePixelRatio);

  if (isSafari) {
    canvas.value?.classList.add('hidden');
  }
});

</script>


<style lang="scss">

.scratch-card {
  position: relative;
  // border: 4px solid #c7c6cf;
  border-radius: 8px;
  padding: 12px;
  // width: 320px;
  // height: 320px;
  width: max-content;
  background-color: #fff;
}

.scratch-card-cover-container {
  position: absolute;
  // z-index: 1;
  top: 0;
  left: 0;
  border-radius: 4px;
  width: 100%;
  height: 100%;
  filter: url('#remove-black');
  transition: opacity .4s;

  &.clear {
    opacity: 0;
  }
  
  &.hidden {
    display: none;
  }
}

.scratch-card-canvas {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
  
  &.hidden {
    opacity: 0;
  }
  
  &:active {
    cursor: grabbing;
  }
}

.scratch-card-canvas-render {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  // background-color: transparent;
  transition: background-color .2s;
  
  &.hidden {
    display: none;
  }
}

.scratch-card-cover {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  // background-color: #cfced6;
  // background-image: linear-gradient(to right, #cfced6, #e0dfe6, #efeef3, #e0dfe6, #cfced6);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    // background-image: linear-gradient(135deg, transparent 40%, rgb(255 255 255 / .8) 50%, transparent 60%);
    background-position: bottom right;
    background-size: 300% 300%;
    background-repeat: no-repeat;
    
    @at-root .scratch-card-cover.shine::before {
      animation: 
        shine 8s infinite,
      ;
    }
  }
  
  @keyframes shine {
    50% {
      background-position: 0% 0%;
    }
    100% {
      background-position: -50% -50%;
    }
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    // opacity: .1;
    // filter: url('#noise');
  }
}

.scratch-card-cover-background {
  width: 100%;
  height: 100%;
  fill: hsl(281, 98%, 31%);
  // opacity: 1;
}

.scratch-card-image {
  border-radius: 4px;
  width: 100%;
  height: 100%;
  object-fit: contain;
  // filter: drop-shadow(0 4px 4px rgb(0 0 0 / .16));
  user-select: none;
  will-change: transform;
  
  &.animate {
    animation: pop-out-in cubic-bezier(.65, 1.35, .5, 1) 1s;
  }
}

@keyframes pop-out-in {
  36% {
    transform: scale(1.125);
  }
  100% {
    transform: scale(1);
  }
}

// #brush path {
//   opacity: 1;
//   fill: #000000;
// }
// #brush:hover path { 
//   fill: yellow;
//   transition: fill .4s ease;
// }

// text-shadow might not support every browser
.blurry-text {
   color: transparent;
   text-shadow: 0 0 5px rgba(0,0,0,0.5);
}
</style>