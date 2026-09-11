<script setup>
import { computed, ref } from "vue"
import { contactContent } from "../content/siteContent.js"

const location = ref("Studio in Ubi — S$35/hour")
const name = ref("")
const instrument = ref("Piano")
const experience = ref("")
const availability = ref("")
const goals = ref("")
const phone = contactContent.channels.find(channel => channel.id === "whatsapp").value.replace(/\D/g, "")
const whatsappNumber = phone.length === 8 ? `65${phone}` : phone
const message = computed(() => [
  "Hi! I'd like to book a free trial lesson.",
  `Name: ${name.value.trim()}`,
  `Instrument / role: ${instrument.value.trim()}`,
  `Regular lesson location: ${location.value}`,
  `Experience: ${experience.value.trim() || "Let's discuss"}`,
  `Availability: ${availability.value.trim() || "Let's discuss"}`,
  `Goals: ${goals.value.trim() || "Let's discuss"}`,
  "Please confirm the free trial duration, location and available times.",
].join("\n"))
const emailLink = computed(() => `mailto:${contactContent.email}?subject=Free%20trial%20lesson%20enquiry&body=${encodeURIComponent(message.value)}`)
function openWhatsApp() {
  window.location.assign(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message.value)}`)
}
</script>

<template>
  <div class="launch">
    <section class="launch-hero" aria-labelledby="launch-title">
      <div class="eyebrow">PERSONAL MUSIC LESSONS · SINGAPORE</div>
      <h1 id="launch-title">Make room<br>for <em>your music.</em></h1>
      <p class="intro">Music lessons from S$35 an hour. Personal guidance, music you care about, and a clear plan to keep you moving. Start with a free trial.</p>
      <div class="actions">
        <a class="primary" href="#enquire">Book a free trial <span aria-hidden="true">↗</span></a>
      </div>
      <div class="hero-note">Piano · Acoustic & electric guitar · Bass · Drums · Saxophone<br>Studio in Ubi, Singapore 410633</div>
    </section>

    <section class="pricing" aria-labelledby="pricing-title">
      <div class="eyebrow">STRAIGHTFORWARD PRICING · ALL SKILL LEVELS</div>
      <h2 id="pricing-title">More music for your money.</h2>
      <div class="benefits">
        <article><span>STUDIO IN UBI · 410633</span><h3 class="price">S$35 <small>/ hour</small></h3><p>A full hour of one-to-one teaching at my studio.</p></article>
        <article><span>I COME TO YOU</span><h3 class="price">S$60 <small>/ hour</small></h3><p>One-to-one lessons at your location. Arrange travel and availability directly.</p></article>
        <article><span>TRY A LESSON</span><h3 class="price">Free trial</h3><p>Meet your teacher and explore your goals. Confirm your trial’s duration, location and time when booking.</p></article>
      </div>
      <p class="rate-note">The same hourly rate at every skill level. Classical, rock, pop and jazz — learn in the direction that interests you.</p>
      <p class="rate-note">For comparison: Replugged lists individual pop piano and guitar at S$260 for four 60-minute sessions (S$65/hour). My studio lessons are approximately 46% less at S$35/hour. <a href="https://www.replugged.com/faqs/" target="_blank" rel="noopener noreferrer">View published rates ↗</a> · Checked 11 September 2026. Programmes and terms differ; this comparison applies to studio lessons.</p>
    </section>

    <section class="value" aria-labelledby="value-title">
      <div class="eyebrow">MORE PURPOSE IN EVERY LESSON</div>
      <h2 id="value-title">Your goals. Your pace.<br>A lesson that fits.</h2>
      <div class="benefits">
        <article><span>01 / EXPERIENCE</span><h3>Learn with a musician</h3><p>Five years teaching at Aureus Academy, backed by 15 years in classical piano and eight on guitar.</p></article>
        <article><span>02 / DIRECTION</span><h3>Know what to practise</h3><p>Work on technique, theory and performance with a practice plan shaped around your level and goals.</p></article>
        <article><span>03 / YOUR MUSIC</span><h3>Make it personal</h3><p>Bring exam pieces, a favourite song or a fresh start. Build useful musical skills through the music that matters to you.</p></article>
      </div>
      <p class="rate-note">Choose your instrument and tell me your goals. We’ll discuss the lesson format and available times before you book.</p>
    </section>

    <section id="enquire" class="enquiry" aria-labelledby="enquiry-title">
      <div><div class="eyebrow">START A CONVERSATION</div><h2 id="enquiry-title">Your first step starts here.</h2><p>Send your details on WhatsApp. We’ll chat about the next step and confirm arrangements together.</p><p class="small">A trial enquiry is a request, not a confirmed booking. Your message is sent only when you press Send in WhatsApp or your email app.</p></div>
      <form @submit.prevent="openWhatsApp">
        <label>Your name<input v-model="name" autocomplete="name" required maxlength="100" placeholder="What should I call you?"></label>
        <label>Instrument<select v-model="instrument"><option>Piano</option><option>Acoustic guitar</option><option>Electric guitar</option><option>Bass</option><option>Drums</option><option>Saxophone</option><option>Music theory</option><option>Help me choose</option></select></label>
        <label>Regular lesson location<select v-model="location"><option>Studio in Ubi — S$35/hour</option><option>My location — S$60/hour</option></select></label>
        <label>Experience <span>(optional)</span><input v-model="experience" maxlength="250" placeholder="New to this? That’s useful to know too."></label>
        <label>Availability <span>(optional)</span><input v-model="availability" maxlength="250" placeholder="e.g. weekday evenings, Saturday afternoons"></label>
        <label>What would you like to learn? <span>(optional)</span><textarea v-model="goals" rows="3" maxlength="1200" placeholder="Favourite songs, exams, confidence, technique…"></textarea></label>
        <button class="primary send" type="submit">Continue to WhatsApp ↗</button>
        <a class="email" :href="emailLink">Prefer email? Open an email draft</a>
      </form>
    </section>
    <footer><strong>MUSIC LESSONS</strong><span>Music, made personal. Singapore.</span><a :href="`mailto:${contactContent.email}`">Email enquiries</a></footer>
  </div>
</template>

<style scoped>
@media(max-width:700px){.launch input,.launch select,.launch textarea{font-size:16px}.launch .email{min-height:44px;display:flex;align-items:center;justify-content:center}}
.pricing{background:#2a2018}.price{font-size:32px!important;color:#e4b778}.price small{font-size:14px;font-weight:400}.rate-note a{color:#e4b778;text-decoration:underline}
.launch{color:#fff0df;background:#17120f;font-family:var(--font-body);border-radius:12px;overflow:hidden;margin:16px 0 0}.launch section{padding:clamp(28px,6vw,80px);scroll-margin-top:85px}.launch-hero{background:radial-gradient(ellipse at 95% 10%,#a66e3866,transparent 55%),radial-gradient(ellipse at 80% 95%,#b8875855,transparent 55%),linear-gradient(125deg,#211812,#3b2b20);min-height:540px;display:flex;flex-direction:column;justify-content:center}.eyebrow{font-size:11px;letter-spacing:.17em;font-weight:700;color:#d8b993}.launch h1{font-size:clamp(48px,6.8vw,92px);line-height:1.05;letter-spacing:-.055em;margin:30px 0 22px}.launch h1 em{font-style:normal;color:#e4b778}.launch .intro{font-size:clamp(16px,1.5vw,20px);max-width:540px;line-height:1.75;color:#e2cdb5}.actions{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-top:32px}.primary,.secondary{display:inline-flex;justify-content:center;align-items:center;gap:20px;min-height:48px;padding:14px 22px;font-size:14px;font-weight:700;border-radius:6px}.primary{background:#e4b778;color:#281a0f;border:1px solid #e4b778;cursor:pointer}.primary:hover{background:#f0cc98;color:#281a0f}.secondary{border:1px solid #8e6e4e;color:#fff0df}.secondary:hover{background:#ffffff10;color:#e4b778}.hero-note{margin-top:40px;font-size:12px;color:#c7ab8d}.launch h2{font-size:clamp(30px,3.6vw,48px);line-height:1.15;letter-spacing:-.035em;margin:20px 0 28px}.benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:45px}.benefits article{border-top:1px solid #6c503a;padding-top:22px}.benefits span{font-size:10px;letter-spacing:.1em;color:#c4a17a}.benefits h3{font-size:19px}.launch p{color:#d2bca4;line-height:1.8}.rate-note{margin-top:34px!important;font-size:13px}.band{display:grid;grid-template-columns:1fr 1fr;gap:45px;background:linear-gradient(115deg,#493323,#352821);align-items:center}.band .secondary{margin-top:24px}.enquiry{display:grid;grid-template-columns:1fr 1fr;gap:50px}.small{font-size:12px;margin-top:24px}.choice{display:flex;gap:8px;margin-bottom:24px}.choice button{flex:1;padding:12px;border:1px solid #7b5e44;border-radius:5px;background:transparent;color:#e4d0b8;font:inherit;font-size:12px;cursor:pointer}.choice button[aria-pressed=true]{background:#e4b778;color:#281a0f;border-color:#e4b778}label{display:block;font-size:12px;margin-bottom:16px}label span{color:#b79c81}input,select,textarea{display:block;width:100%;margin-top:8px;border:1px solid #71543d;background:#271d16;color:#fff0df;border-radius:5px;padding:12px;font:inherit;font-size:14px}textarea{resize:vertical}input::placeholder,textarea::placeholder{color:#b79d83}.send{width:100%;font-family:inherit}.email{display:block;text-align:center;font-size:12px;margin-top:18px;color:#e9bd87}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #e6bd84;outline-offset:4px}footer{padding:28px clamp(28px,6vw,80px);border-top:1px solid #59412e;display:flex;gap:18px;justify-content:space-between;flex-wrap:wrap;font-size:11px;color:#c6ac90}footer strong{letter-spacing:.15em}footer a{color:#e9bd87}@media(max-width:700px){.launch{margin:8px 12px 0}.launch-hero{min-height:530px}.benefits,.band,.enquiry{grid-template-columns:1fr;gap:26px}.benefits{margin-top:30px}.launch h2{margin-bottom:20px}.band h2{margin-bottom:0}.actions{gap:12px}.primary,.secondary{padding:13px 16px}.hero-note{line-height:1.9}.enquiry{gap:30px}}
</style>
