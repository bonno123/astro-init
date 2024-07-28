<template>
    <div>
        <form @submit.prevent="submitForm">
            <fieldset class="margin-bottom-2xs">
                <div class="flex vertical-align-center margin-bottom-400">
                    <legend class="form-legend">Contact Form</legend>

                    <span
                        v-if="connectionHealthStatus === 'online'" 
                        class="badge badge--success-light badge--icon">
                        <i>Online</i>
                    </span>

                    <span
                        v-else-if="connectionHealthStatus === 'offline'" 
                        class="badge badge--error-light badge--icon">
                        <i>Offline</i>
                    </span>

                    <span
                        v-else 
                        class="badge badge--warning-light badge--icon">
                        <i>Checking...</i>
                    </span>

                </div>

                <div class="grid gap-sm">
                    <div class="col-6@md">
                        <label 
                            class="form-label margin-bottom-2xs" 
                            for="input-name"
                        >
                            Name
                        </label>
                        <input 
                            id="input-name" 
                            class="form-input width-100%" 
                            type="text" name="input-name" 
                            required
                            v-model="name"
                        >
                    </div>
                
                    <div class="col-6@md">
                        <label class="form-label margin-bottom-2xs" for="input-email">Email</label>
                        <input 
                            v-model="email"
                            class="form-input width-100%" 
                            type="email" 
                            name="input-email" 
                            id="input-email" 
                            placeholder="email@myemail.com"
                        >
                    </div>
                   
                    <div>
                        <label class="form-label margin-bottom-2xs" for="textarea">Message</label>
                        <textarea 
                            class="form-input width-100%" 
                            name="textarea" 
                            id="textarea" 
                            v-model="message" 
                        >
                        </textarea>

                        <p class="fw3-text-xs fw3-color-contrast-medium fw3-margin-top-2xs" v-if="0">
                            Use helper text to provide additional information.
                        </p>
                    </div>
                </div>
            </fieldset>

            <div class="fw3-margin-top-sm">
                <button
                    :disabled="connectionHealthStatus === 'checking' || shouldShowSpinner" 
                    class="btn btn--primary"
                >
                    {{shouldShowSpinner ? 'Sending...' : 'Send'}}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import useNotification from '~/utils/useNotification.ts';

const { notify } = useNotification();

const email = ref('asd@dfg.gfh');
const name = ref('bonno');
const message = ref('dfgdfgdfg asdfsd');

const shouldShowSpinner = ref(false);
const connectionHealthStatus= ref<'online' | 'offline' | 'checking'>('checking');

function clearForm() {
    email.value = '';
    name.value = '';
    message.value = '';
}

const submitForm = async () => {
    shouldShowSpinner.value = true;
    try {
        const backendUrl = import.meta.env.PUBLIC_BACKEND_SERVER_URL;
        const url = `${backendUrl}/contact`;

        console.log(url);
        const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name.value,
            email: email.value,
            message: message.value,
        }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data); // Handle success

        clearForm();

        notify({
            type: 'success',
            message: 'Message sent successfully.',
        });

    } catch (error) {
        console.error('Error:', error); // Handle error

        notify({
            type: 'error',
            message: 'An error occurred. Please try again later.',
        });
    } finally {
        shouldShowSpinner.value = false;
    }
};

function checkConnectionHealth() {
  connectionHealthStatus.value = 'checking';
    fetch(import.meta.env.PUBLIC_BACKEND_SERVER_URL)
      .then(() => {
        connectionHealthStatus.value = 'online';
      })
      .catch(() => {
        connectionHealthStatus.value = 'offline';
      });
}

checkConnectionHealth();
</script>

<style scoped>
/* Add your custom styles here */

/* variables */
* {
  /* colors */
  --fw3-color-primary-hsl: 250, 84%, 54%;
  --fw3-color-bg-hsl: 0, 0%, 100%;
  --fw3-color-contrast-high-hsl: 230, 7%, 23%;
  --fw3-color-contrast-higher-hsl: 230, 13%, 9%;
  --fw3-color-error-hsl: 342, 89%, 48%;
  --fw3-color-contrast-medium-hsl: 225, 4%, 47%;
  --fw3-color-bg-dark-hsl: 240, 4%, 95%;
  --fw3-color-white-hsl: 0, 0%, 100%;
  --fw3-color-primary-darker-hsl: 250, 84%, 38%;
  --fw3-color-primary-light-hsl: 250, 84%, 60%;
  --fw3-color-contrast-lower-hsl: 240, 4%, 85%;
  --fw3-color-contrast-low-hsl: 240, 4%, 65%;

  /* spacing */
  --fw3-space-3xs: 0.25rem;
  --fw3-space-2xs: 0.375rem;
  --fw3-space-xs: 0.5rem;
  --fw3-space-sm: 0.75rem;
  --fw3-space-md: 1.25rem;

  /* typography */
  --fw3-text-sm: 0.833rem;
  --fw3-text-xs: 0.694rem;
  --fw3-text-md: 1.2rem;
}


/* buttons */
.btn {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 1em;
  white-space: nowrap;
  text-decoration: none;
  background: hsl(var(--fw3-color-bg-dark-hsl));
  color: hsl(var(--fw3-color-contrast-higher-hsl));
  cursor: pointer;
  text-decoration: none;
  /* line-height: 1.2; */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: all 0.2s ease;
  will-change: transform;
  padding: var(--fw3-space-2xs) var(--fw3-space-sm);
  border-radius: 0.25em;
}

.btn:focus-visible {
  box-shadow: 0px 0px 0px 2px hsl(var(--fw3-color-bg-hsl)), 0px 0px 0px 4px hsla(var(--fw3-color-contrast-higher-hsl), 0.15);
  outline: none;
}

.btn:active {
  transform: translateY(2px);
}

.btn--primary {
  background: hsl(var(--fw3-color-primary-hsl));
  color: hsl(var(--fw3-color-white-hsl));
  box-shadow: inset 0px 1px 0px hsla(var(--fw3-color-white-hsl), 0.15), 0px 1px 3px hsla(var(--fw3-color-primary-darker-hsl), 0.25), 0px 2px 6px hsla(var(--fw3-color-primary-darker-hsl), 0.1), 0px 6px 10px -2px hsla(var(--fw3-color-primary-darker-hsl), 0.25);
}

.fw3-btn--primary:hover {
  background: hsl(var(--fw3-color-primary-light-hsl));
  box-shadow: inset 0px 1px 0px hsla(var(--fw3-color-white-hsl), 0.15), 0px 1px 2px hsla(var(--fw3-color-primary-darker-hsl), 0.25), 0px 1px 4px hsla(var(--fw3-color-primary-darker-hsl), 0.1), 0px 3px 6px -2px hsla(var(--fw3-color-primary-darker-hsl), 0.25);
}

.btn--primary:focus {
  box-shadow: inset 0px 1px 0px hsla(var(--fw3-color-white-hsl), 0.15), 0px 1px 2px hsla(var(--fw3-color-primary-darker-hsl), 0.25), 0px 1px 4px hsla(var(--fw3-color-primary-darker-hsl), 0.1), 0px 3px 6px -2px hsla(var(--fw3-color-primary-darker-hsl), 0.25), 0px 0px 0px 2px hsl(var(--fw3-color-bg-hsl)), 0px 0px 0px 4px hsl(var(--fw3-color-primary-hsl));
}

button:disabled,
  button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
  }


/* form elements */
.form-input {
  font-size: 1em;
  padding: var(--fw3-space-2xs) var(--fw3-space-xs);
  background: hsl(var(--fw3-color-bg-dark-hsl));
  /* line-height: 1.2; */
  box-shadow: inset 0px 0px 0px 1px hsl(var(--fw3-color-contrast-lower-hsl));
  transition: all 0.2s ease;
  border-radius: 0.25em;
}

.form-input::placeholder {
  opacity: 1;
  color: hsl(var(--fw3-color-contrast-low-hsl));
}

.form-input:focus, .form-input:focus-within {
  background: hsl(var(--fw3-color-bg-hsl));
  box-shadow: inset 0px 0px 0px 1px hsla(var(--fw3-color-contrast-lower-hsl), 0), 0px 0px 0px 2px hsl(var(--fw3-color-primary-hsl)), 0 0.3px 0.4px rgba(0, 0, 0, 0.025),0 0.9px 1.5px rgba(0, 0, 0, 0.05), 0 3.5px 6px rgba(0, 0, 0, 0.1);
  outline: none;
}

.form-input.form-input--error {
  box-shadow: inset 0px 0px 0px 1px hsla(var(--fw3-color-contrast-lower-hsl), 0), 0px 0px 0px 2px hsl(var(--fw3-color-error-hsl));
}

.form-input.form-input--error:focus, .form-input.form-input--error:focus-within {
  box-shadow: inset 0px 0px 0px 1px hsla(var(--fw3-color-contrast-lower-hsl), 0), 0px 0px 0px 2px hsl(var(--fw3-color-error-hsl)), 0 0.3px 0.4px rgba(0, 0, 0, 0.025),0 0.9px 1.5px rgba(0, 0, 0, 0.05), 0 3.5px 6px rgba(0, 0, 0, 0.1);
}

.form-legend {
  color: hsl(var(--fw3-color-contrast-higher-hsl));
  line-height: 1.2;
  font-size: var(--fw3-text-md);
  /* margin-bottom: var(--fw3-space-sm); */
}

.form-label {
  display: inline-block;
  font-size: var(--fw3-text-sm);
}

/* component */


/* utility classes */
.fw3-gap-md {
  gap: var(--fw3-space-md);
}

.fw3-flex-wrap {
  flex-wrap: wrap;
}

.fw3-flex {
  display: flex;
}

.fw3-gap-3xs {
  gap: var(--fw3-space-3xs);
}

.fw3-flex-column {
  flex-direction: column;
}

.fw3-margin-top-2xs {
  margin-top: var(--fw3-space-2xs);
}

.fw3-margin-top-sm {
  margin-top: var(--fw3-space-sm);
}

.fw3-color-contrast-medium {
  --fw3-color-o: 1;
  color: hsla(var(--fw3-color-contrast-medium-hsl), var(--fw3-color-o, 1));
}

.fw3-text-xs {
  font-size: var(--fw3-text-xs);
}

.width-100\% {
  width: 100%;
}

.margin-bottom-2xs {
  margin-bottom: var(--fw3-space-2xs);
}

.fw3-color-contrast-higher {
  --fw3-color-o: 1;
  color: hsla(var(--fw3-color-contrast-higher-hsl), var(--fw3-color-o, 1));
}

.fw3-text-sm {
  font-size: var(--fw3-text-sm);
}

.fw3-radius-md {
  border-radius: 0.25em;
}

.fw3-padding-xs {
  padding: var(--fw3-space-xs);
}

.bg-error {
  --fw3-bg-o: 1;
  background-color: hsla(var(--fw3-color-error-hsl), var(--fw3-bg-o, 1));
}

.gap-sm {
  gap: var(--fw3-space-sm);
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
}

.grid > * {
  min-width: 0;
  grid-column-end: span 12;
}

.bg-opacity-20\% {
  --fw3-bg-o: 0.2;
}

@media(min-width: 64rem){
  .col-6\@md {
    grid-column-end: span 6;
  }
}

/* ============badge================ */
.badge {
  /* reset - in case the class is applied to a <button> */
  border: 0;
  color: inherit;
  line-height: 1;
  appearance: none;

  display: inline-flex;
  align-items: center;
  border-radius: 0.375em;

  background-color: hsl(240, 4%, 90%);
  padding: 0.25rem 0.5rem;

  font-size: 0.675rem;
}

.badge--success-light {
  background-color: hsla(170, 78%, 36%, 0.2);
  color: hsl(230, 13%, 9%);
}

.badge--error-light {
  background-color: hsla(342, 89%, 48%, 0.2);
  color: hsl(230, 13%, 9%);
}


</style>