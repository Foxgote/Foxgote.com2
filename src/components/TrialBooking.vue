<script setup>
import { computed, ref } from "vue"
import { contactContent } from "../content/siteContent.js"
const name = ref("")
const instrument = ref("Piano")
const location = ref("Studio in Ubi — S$35/hour")
const availability = ref("")
const goals = ref("")
const phone = contactContent.channels.find(channel => channel.id === "whatsapp").value.replace(/\D/g, "")
const message = computed(() => ["Hi! I'd like to book a free trial lesson.", `Name: ${name.value.trim()}`, `Instrument: ${instrument.value}`, `Regular lesson location: ${location.value}`, `Availability: ${availability.value.trim() || "Let's discuss"}`, `Experience / goals: ${goals.value.trim() || "Let's discuss"}`, "Please confirm the trial duration, location and available times."].join("\n"))
const emailUrl = computed(() => `mailto:${contactContent.email}?subject=Free%20trial%20enquiry&body=${encodeURIComponent(message.value)}`)
function enquire() { window.location.assign(`https://wa.me/${phone.length === 8 ? `65${phone}` : phone}?text=${encodeURIComponent(message.value)}`) }
</script>

<template>
  <section class="trial-booking" aria-labelledby="trial-heading">
    <div class="rates">
      <div><span>My studio in Ubi</span><strong>S$35 <small>/ hour</small></strong></div>
      <div><span>At your place</span><strong>S$60 <small>/ hour</small></strong></div>
      <div><span>Come try a lesson</span><strong>Free trial</strong></div>
    </div>
    <p>The hourly rate stays the same as you progress. I teach piano, acoustic and electric guitar, bass, drums and saxophone, across classical, rock, pop and jazz.</p>
    <details><summary>Compare lesson rates</summary><p>My S$35 studio hour is approximately 46% less than Replugged’s published individual pop piano/guitar rate of S$260 for four 60-minute lessons (S$65/hour). <a href="https://www.replugged.com/faqs/" target="_blank" rel="noopener noreferrer">Published rates</a>, checked 11 September 2026. Programmes and terms differ; comparison applies to studio lessons.</p></details>
    <h3 id="trial-heading">Book a free trial</h3>
    <p>Your free trial can be at my studio in Ubi or at your place. Contact me to arrange a time. It’s fine if you’re not sure where to start — we can figure that out together.</p>
    <form @submit.prevent="enquire">
      <div class="fields">
        <label>Your name<input v-model="name" required autocomplete="name" maxlength="100"></label>
        <label>Instrument<select v-model="instrument"><option>Piano</option><option>Acoustic guitar</option><option>Electric guitar</option><option>Bass</option><option>Drums</option><option>Saxophone</option><option>Music theory</option><option>Help me choose</option></select></label>
        <label>Where would you like your regular lessons?<select v-model="location"><option>Studio in Ubi — S$35/hour</option><option>My location — S$60/hour</option></select></label>
        <label>Availability (optional)<input v-model="availability" maxlength="250" placeholder="Preferred days and times"></label>
      </div>
      <label>A little about you (optional)<textarea v-model="goals" rows="3" maxlength="1200" placeholder="A song you love, what you’ve played before, or something you’d like help with…"></textarea></label>
      <div class="booking-actions"><button type="submit" class="page-action-link">Continue to WhatsApp</button><a :href="emailUrl" class="page-action-link">Open email draft</a></div>
      <p class="booking-note">This opens a message for you to review and send. We’ll arrange your trial’s time, length and location together.</p>
    </form>
  </section>
</template>

<style scoped>
.trial-booking{min-width:0;border:1px solid var(--hairline);border-radius:8px;padding:clamp(1rem,2vw,1.25rem);background:linear-gradient(160deg,rgba(18,14,10,.52),rgba(8,8,10,.7));font-family:var(--font-body);color:var(--text)}
.rates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.rates span{display:block;font-size:.65rem;letter-spacing:.1em;color:var(--accent)}.rates strong{display:block;font-family:var(--font-display);font-size:clamp(1.3rem,3vw,1.8rem);font-weight:620;margin-top:.5rem}.rates small{font-size:.8rem;font-weight:400}.trial-booking p{font-size:.9rem;line-height:1.65;color:rgba(255,220,180,.82);margin:.9rem 0}.trial-booking h3{font-family:var(--font-display);font-size:1.1rem;font-weight:620;letter-spacing:0;margin:1.5rem 0 1rem}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}label{display:block;min-width:0;font-size:.72rem;color:rgba(255,235,208,.9);margin-bottom:1rem}input,select,textarea{display:block;width:100%;min-width:0;margin-top:.45rem;padding:.75rem;border:1px solid rgba(255,220,180,.22);border-radius:2px;background:rgba(10,11,13,.54);color:var(--text);font:inherit;font-size:1rem}textarea{resize:vertical}.booking-actions{display:flex;flex-wrap:wrap;gap:.65rem}.booking-actions .page-action-link{min-height:44px;cursor:pointer}.trial-booking .booking-note{font-size:.75rem;margin-bottom:0}details{font-size:.75rem;margin-top:1rem}summary{cursor:pointer;color:var(--accent)}details a{text-decoration:underline;color:var(--accent)}input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px}@media(max-width:600px){.rates,.fields{grid-template-columns:1fr}.rates{gap:.8rem}.rates>div{display:flex;justify-content:space-between;gap:.8rem;align-items:center}.rates strong{margin:0;white-space:nowrap}}
</style>
