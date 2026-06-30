<script setup>
import { computed, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { contactContent, getServiceById } from "@/content/siteContent"

const route = useRoute()

const senderEmail = ref("")
const draftCc = ref("")
const draftSubject = ref("")
const draftContent = ref("")
const websiteTrap = ref("")
const submitState = ref("idle")
const submitMessage = ref("")

const selectedService = computed(() => {
  const serviceId = String(route.query.service || "")
  return serviceId ? getServiceById(serviceId) : null
})

const selectedServiceLabel = computed(() =>
  selectedService.value ? selectedService.value.title : "General Inquiry",
)

const isSending = computed(() => submitState.value === "sending")

function defaultSubjectForService(service) {
  return service
    ? `${service.title} inquiry`
    : contactContent.draft.subjectFallback
}

function resetSubmitStatus() {
  if (submitState.value === "sending") return
  submitState.value = "idle"
  submitMessage.value = ""
}

async function submitContactForm() {
  submitState.value = "sending"
  submitMessage.value = ""

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: senderEmail.value.trim(),
        cc: draftCc.value.trim(),
        subject: draftSubject.value.trim() || contactContent.draft.subjectFallback,
        content: draftContent.value.trim(),
        website: websiteTrap.value.trim(),
      }),
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Email could not be sent.")
    }

    submitState.value = "success"
    submitMessage.value = "Message sent."
  } catch (error) {
    submitState.value = "error"
    submitMessage.value = error instanceof Error ? error.message : "Email could not be sent."
  }
}

watch(
  selectedService,
  (service) => {
    draftSubject.value = defaultSubjectForService(service)
    draftContent.value = ""
    resetSubmitStatus()
  },
  { immediate: true },
)
</script>

<template>
  <section class="contact-page">
    <nav
      class="contact-quickbar"
      aria-label="Quick contact links"
    >
      <div class="quick-contact-track">
        <span
          v-for="channel in contactContent.channels"
          :key="channel.id"
          class="quick-contact-link"
          :aria-label="`${channel.label} ${channel.value}`"
        >
          <span
            class="quick-contact-icon"
            aria-hidden="true"
          >
            <svg
              v-if="channel.id === 'whatsapp'"
              viewBox="0 0 24 24"
              focusable="false"
            >
              <path d="M12 3.2a8.1 8.1 0 0 0-6.9 12.35L4 20l4.55-1.05A8.1 8.1 0 1 0 12 3.2Z" />
              <path d="M8.95 8.35c.22-.5.4-.52.68-.52h.48c.15 0 .38.05.58.43.2.4.7 1.38.76 1.48.06.1.1.24.02.39-.08.16-.12.25-.25.39-.12.14-.25.31-.36.42-.12.13-.25.27-.1.53.14.27.63 1.05 1.36 1.7.94.84 1.72 1.1 1.98 1.23.26.13.41.11.56-.07.15-.17.65-.76.82-1.02.17-.26.34-.22.58-.13.24.09 1.52.72 1.78.85.26.13.43.19.5.3.06.1.06.61-.15 1.2-.22.6-1.27 1.14-1.77 1.18-.45.04-1.02.06-1.65-.1-.38-.1-.86-.28-1.48-.55-2.6-1.13-4.3-3.75-4.43-3.93-.13-.17-1.06-1.42-1.06-2.7 0-1.28.67-1.91.91-2.17Z" />
            </svg>
            <svg
              v-else-if="channel.id === 'telegram'"
              viewBox="0 0 24 24"
              focusable="false"
            >
              <path d="m21 4.5-3.3 15.1c-.22.98-.8 1.22-1.62.76l-4.48-3.3-2.16 2.08c-.24.24-.44.44-.9.44l.32-4.57 8.32-7.52c.36-.32-.08-.5-.56-.18L6.34 13.78 1.9 12.39c-.96-.3-.98-.96.2-1.42L19.46 4.3c.8-.3 1.5.18 1.54.2Z" />
            </svg>
            <svg
              v-else-if="channel.id === 'discord'"
              viewBox="0 0 24 24"
              focusable="false"
            >
              <path d="M7.2 5.2A12.3 12.3 0 0 1 10 4.3l.36.72a11.1 11.1 0 0 1 3.28 0L14 4.3a12.3 12.3 0 0 1 2.8.9c1.78 2.62 2.27 5.18 2.03 7.7a11.2 11.2 0 0 1-3.43 1.72l-.73-1.02c.4-.15.78-.34 1.14-.56-.1-.07-.2-.15-.3-.23a7.9 7.9 0 0 1-7.02 0l-.3.23c.36.22.74.41 1.14.56l-.73 1.02a11.2 11.2 0 0 1-3.43-1.72c-.29-2.93.5-5.46 2.03-7.7Zm2.16 5.95c.67 0 1.2-.61 1.2-1.36 0-.76-.54-1.36-1.2-1.36-.66 0-1.2.6-1.2 1.36 0 .75.54 1.36 1.2 1.36Zm5.28 0c.66 0 1.2-.61 1.2-1.36 0-.76-.54-1.36-1.2-1.36-.67 0-1.2.6-1.2 1.36 0 .75.53 1.36 1.2 1.36Z" />
            </svg>
            <svg
              v-else-if="channel.id === 'x'"
              viewBox="0 0 24 24"
              focusable="false"
            >
              <path d="M5 4h3.3l4.34 5.56L17.46 4H21l-6.62 7.64L21.3 20h-3.28l-4.9-6.26L7.7 20H4.16l7.22-8.32L5 4Zm2.16 1.52 11.56 12.96h.96L8.12 5.52h-.96Z" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              focusable="false"
            >
              <path d="M8 3.5h8A4.5 4.5 0 0 1 20.5 8v8a4.5 4.5 0 0 1-4.5 4.5H8A4.5 4.5 0 0 1 3.5 16V8A4.5 4.5 0 0 1 8 3.5Zm0 1.8A2.7 2.7 0 0 0 5.3 8v8A2.7 2.7 0 0 0 8 18.7h8a2.7 2.7 0 0 0 2.7-2.7V8A2.7 2.7 0 0 0 16 5.3H8Zm4 3.1a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Zm0 1.8a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm4.2-2.2a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z" />
            </svg>
          </span>
          <span class="quick-contact-label">{{ channel.label }}</span>
          <span class="quick-contact-value">{{ channel.value }}</span>
        </span>
      </div>
    </nav>

    <section
      class="contact-email"
      aria-labelledby="contact-email-heading"
    >
      <header class="contact-email-header">
        <h1 id="contact-email-heading">
          {{ contactContent.draft.heading }}
        </h1>
        <span class="contact-service-label">{{ selectedServiceLabel }}</span>
      </header>

      <form
        class="email-compose-form"
        @submit.prevent="submitContactForm"
      >
        <label
          class="contact-honeypot"
          aria-hidden="true"
        >
          <span>Website</span>
          <input
            v-model="websiteTrap"
            type="text"
            tabindex="-1"
            autocomplete="off"
          />
        </label>

        <div class="email-field-grid">
          <label class="email-field">
            <span class="email-field-label">Email</span>
            <input
              v-model="senderEmail"
              type="email"
              :placeholder="contactContent.draft.emailPlaceholder"
              autocomplete="email"
              required
              @input="resetSubmitStatus"
            />
          </label>

          <label class="email-field">
            <span class="email-field-label">CC</span>
            <input
              v-model="draftCc"
              type="email"
              :placeholder="contactContent.draft.ccPlaceholder"
              autocomplete="email"
              @input="resetSubmitStatus"
            />
          </label>

          <label class="email-field">
            <span class="email-field-label">Subject</span>
            <input
              v-model="draftSubject"
              type="text"
              autocomplete="off"
              @input="resetSubmitStatus"
            />
          </label>
        </div>

        <label class="email-field email-message-field">
          <span class="email-field-label">Content</span>
          <textarea
            v-model="draftContent"
            spellcheck="true"
            @input="resetSubmitStatus"
          ></textarea>
        </label>

        <div class="email-compose-footer">
          <div class="email-submit-group">
            <p
              v-if="submitMessage"
              class="email-submit-status"
              :class="`is-${submitState}`"
              role="status"
            >
              {{ submitMessage }}
            </p>

            <button
              class="email-send-button"
              type="submit"
              :disabled="isSending"
            >
              {{ isSending ? "Sending" : "Send Email" }}
            </button>
          </div>
        </div>
      </form>
    </section>
  </section>
</template>

<style scoped>
.contact-page {
  width: 100%;
  margin: 0 auto;
  padding: 0.75rem var(--page-inline-pad, 0) 3rem;
  display: grid;
  gap: clamp(1rem, 2.4vw, 1.5rem);
}

.contact-quickbar {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.15rem 0 0.5rem;
  scrollbar-width: thin;
}

.quick-contact-track {
  width: max-content;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: clamp(0.9rem, 2vw, 1.35rem);
}

.quick-contact-link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
  padding: 0.3rem 0;
  color: rgba(255, 235, 208, 0.88);
  font-size: 0.75rem;
  line-height: 1;
  white-space: nowrap;
  cursor: default;
}

.quick-contact-icon {
  width: 1rem;
  height: 1rem;
  display: inline-grid;
  place-items: center;
  color: rgba(212, 161, 94, 0.92);
}

.quick-contact-icon svg {
  width: 100%;
  height: 100%;
  display: block;
  fill: currentColor;
}

.quick-contact-label {
  color: currentColor;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.quick-contact-value {
  color: rgba(255, 238, 220, 0.86);
}

.contact-email {
  display: grid;
  gap: clamp(0.85rem, 2vw, 1.2rem);
}

.contact-email-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
}

.contact-email h1 {
  margin: 0;
  color: rgba(255, 241, 226, 0.98);
  font-size: clamp(1.65rem, 4vw, 2.85rem);
  line-height: 1.02;
  letter-spacing: 0;
}

.contact-service-label,
.email-field-label {
  color: rgba(212, 161, 94, 0.9);
  font-size: 0.68rem;
  letter-spacing: 0.13em;
  line-height: 1.2;
  text-transform: uppercase;
}

.contact-service-label {
  max-width: 42%;
  padding-bottom: 0.22rem;
  color: rgba(255, 224, 190, 0.72);
  text-align: right;
}

.email-compose-form {
  position: relative;
  display: grid;
  gap: clamp(0.72rem, 1.7vw, 1rem);
}

.contact-honeypot {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.email-field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.72rem, 1.7vw, 1rem);
}

.email-field {
  min-width: 0;
  display: grid;
  gap: 0.36rem;
  border: 1px solid rgba(255, 220, 180, 0.18);
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(18, 14, 10, 0.44), rgba(8, 8, 10, 0.66));
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.025);
  padding: 0.72rem 0.82rem;
  color: rgba(255, 237, 214, 0.94);
  transition:
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}

.email-field:focus-within {
  border-color: rgba(255, 220, 180, 0.52);
  background: linear-gradient(160deg, rgba(22, 17, 12, 0.58), rgba(9, 9, 11, 0.78));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 0 2px rgba(212, 161, 94, 0.1),
    0 10px 18px rgba(0, 0, 0, 0.3);
}

.email-field input,
.email-field textarea {
  width: 100%;
  border: 0;
  background: transparent;
  color: rgba(255, 237, 214, 0.94);
  font: inherit;
  line-height: 1.45;
  outline: none;
}

.email-field input {
  min-height: 1.9rem;
}

.email-field textarea {
  min-height: 17rem;
  padding: 0.1rem 0 0.2rem;
  resize: vertical;
}

.email-field input::placeholder,
.email-field textarea::placeholder {
  color: rgba(255, 224, 190, 0.42);
}

.email-message-field {
  border-radius: 16px;
  padding: 0.9rem 0.95rem;
}

.email-compose-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  align-items: center;
}

.email-submit-group {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.75rem;
}

.email-send-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.25rem;
  border: 1px solid rgba(255, 220, 180, 0.42);
  border-radius: 10px;
  background: rgba(10, 11, 13, 0.46);
  padding: 0.48rem 0.72rem;
  color: rgba(255, 235, 208, 0.94);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.email-send-button {
  cursor: pointer;
}

.email-send-button:hover,
.email-send-button:focus-visible {
  border-color: rgba(255, 235, 208, 0.84);
  color: rgba(255, 247, 232, 1);
  background: rgba(12, 12, 14, 0.58);
  transform: translate(-1px, -1px);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(255, 220, 180, 0.24),
    0 8px 14px rgba(0, 0, 0, 0.32);
}

.email-send-button:focus-visible {
  outline: 2px solid rgba(255, 220, 180, 0.36);
  outline-offset: 3px;
}

.email-send-button:disabled {
  cursor: wait;
  opacity: 0.62;
  transform: none;
  box-shadow: none;
}

.email-submit-status {
  margin: 0;
  color: rgba(255, 224, 190, 0.72);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.email-submit-status.is-success {
  color: rgba(255, 238, 220, 0.9);
}

.email-submit-status.is-error {
  color: rgba(255, 182, 168, 0.92);
}

.email-send-button:active {
  transform: scale(0.96);
  border-color: rgba(255, 220, 180, 0.18);
  background: rgba(5, 5, 7, 0.42);
  color: rgba(205, 184, 164, 0.78);
  box-shadow: none;
}

@media (max-width: 900px) {
  .email-field-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .contact-page {
    padding-top: 0.6rem;
  }

  .contact-quickbar {
    overflow: visible;
    padding: 0 0 0.45rem;
    scrollbar-width: none;
  }

  .contact-quickbar::-webkit-scrollbar {
    display: none;
  }

  .quick-contact-track {
    width: 100%;
    justify-content: center;
    gap: clamp(1.1rem, 7vw, 1.65rem);
  }

  .quick-contact-link {
    width: 2rem;
    height: 2rem;
    justify-content: center;
    padding: 0;
  }

  .quick-contact-icon {
    width: 1.15rem;
    height: 1.15rem;
  }

  .quick-contact-label,
  .quick-contact-value {
    display: none;
  }

  .contact-email-header {
    display: grid;
    align-items: start;
  }

  .contact-service-label {
    max-width: 100%;
    text-align: left;
  }

  .email-field textarea {
    min-height: 13.5rem;
  }

  .email-compose-footer {
    display: grid;
    align-items: stretch;
  }

  .email-submit-group {
    width: 100%;
    display: grid;
  }

  .email-send-button {
    width: 100%;
  }
}
</style>
