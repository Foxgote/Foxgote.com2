<script setup>
import { ref } from "vue"
import { contactContent } from "../content/siteContent.js"

// Temporary announcement: remove this component from Contact when recruitment closes.
const open = ref(true)
const phone = contactContent.channels.find(channel => channel.id === "whatsapp").value.replace(/\D/g, "")
const message = "Hi! I'd like to apply for the band.\nName: \nInstrument / vocals: \nExperience: \nGenres / influences: \nAvailability: \nDemo link (optional): "
const whatsapp = `https://wa.me/${phone.length === 8 ? `65${phone}` : phone}?text=${encodeURIComponent(message)}`
const email = `mailto:${contactContent.email}?subject=Band%20application&body=${encodeURIComponent(message)}`
</script>

<template>
  <Teleport to="body">
    <Transition name="band-slide" appear>
      <aside v-if="open" class="band-announcement" aria-labelledby="band-announcement-title" @keydown.esc="open = false">
        <button class="close" type="button" aria-label="Close band announcement" @click="open = false">×</button>
        <p class="eyebrow">TEMPORARY ANNOUNCEMENT</p>
        <h2 id="band-announcement-title">Starting a band.</h2>
        <p>Applications are open. Play an instrument or sing? Tell me about your music and when you can jam in Singapore.</p>
        <a class="apply" :href="whatsapp">Apply on WhatsApp ↗</a>
        <a class="email" :href="email">Apply by email</a>
        <small>Opens a draft for you to complete and send.</small>
      </aside>
    </Transition>
    <button v-if="!open" type="button" class="band-tab" @click="open = true">Band applications ↗</button>
  </Teleport>
</template>

<style scoped>
.band-announcement{max-width:calc(100% - 32px)}
@media(max-width:640px){aside.band-announcement{top:104px;max-height:calc(100dvh - 128px)}.band-announcement .close{width:44px;height:44px}button.band-tab{top:104px}}
.band-announcement{position:fixed;z-index:110;right:16px;top:84px;width:min(320px,calc(100vw - 32px));max-height:calc(100dvh - 110px);overflow-y:auto;padding:26px;border:1px solid #9a744e;border-radius:12px 0 0 12px;background:linear-gradient(135deg,#4b3525,#281f19);box-shadow:0 14px 50px #0007;color:#fff0df;font-family:var(--font-body,system-ui)}.close{position:absolute;top:7px;right:7px;width:36px;height:36px;background:transparent;border:0;color:#fff0df;font-size:26px;cursor:pointer}.eyebrow{font-size:9px;letter-spacing:.14em;color:#d8b993;margin-right:15px}.band-announcement h2{font-size:25px;line-height:1.2;margin:18px 0 12px}.band-announcement p{font-size:13px;line-height:1.7}.apply,.email{display:block;text-align:center;border-radius:5px;font-size:13px;padding:12px;margin-top:18px}.apply{background:#e4b778;color:#281a0f;font-weight:700}.email{margin-top:4px;color:#e4b778;padding:9px}.band-announcement small{display:block;color:#c7ab8d;font-size:10px;line-height:1.5;text-align:center}.band-tab{position:fixed;right:0;top:100px;z-index:110;background:#4b3525;border:1px solid #9a744e;border-radius:6px 0 0 6px;color:#f0d4b3;padding:12px;font:inherit;font-size:12px;cursor:pointer}.band-slide-enter-active,.band-slide-leave-active{transition:transform .35s ease,opacity .35s ease}.band-slide-enter-from,.band-slide-leave-to{transform:translateX(110%);opacity:0}button:focus-visible,a:focus-visible{outline:2px solid #f4ce8f;outline-offset:3px}@media(prefers-reduced-motion:reduce){.band-slide-enter-active,.band-slide-leave-active{transition:none}}
</style>
