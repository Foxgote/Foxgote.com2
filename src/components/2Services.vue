<template>
  <section class="services-page">
    <header class="services-header">
      <p class="eyebrow">Services</p>
      <h1>Select your choice</h1>
      <p class="lead">Choose the lane that fits your session and goals.</p>
    </header>

    <section class="services-grid">
      <article class="service-card">
        <header class="service-card-head">
          <div>Studio Rental</div>
        </header>
        <div
          class="card-image-slot"
          role="img"
          aria-label="Studio rental image placeholder"
        >
          <span>Studio PNG</span>
        </div>
        <ul class="service-bullets">
          <li>Hourly and half-day booking windows</li>
          <li>Control room plus live room access</li>
          <li>Add-on engineer support available</li>
          <li>Late-night sessions by request</li>
        </ul>
      </article>

      <article class="service-card">
        <header class="service-card-head">
          <div>Music Teaching</div>
        </header>
        <div
          class="card-image-slot"
          role="img"
          aria-label="Music teaching image placeholder"
        >
          <span>Teaching PNG</span>
        </div>
        <ul class="service-bullets">
          <li>Private one-on-one lesson blocks</li>
          <li>Beginner through advanced coaching</li>
          <li>Technique, songwriting, and performance</li>
          <li>Structured plans with weekly goals</li>
        </ul>
      </article>

      <article class="service-card">
        <header class="service-card-head">
          <div>Other Services</div>
        </header>
        <div
          class="card-image-slot"
          role="img"
          aria-label="Other services image placeholder"
        >
          <span>Other PNG</span>
        </div>
        <ul class="service-bullets">
          <li>Vocal tracking and comp preparation</li>
          <li>Demo polish and arrangement feedback</li>
          <li>Mix-ready stem export workflow</li>
          <li>Custom project support by scope</li>
        </ul>
      </article>
    </section>
  </section>
</template>

<style scoped>
.services-page {
  width: 100%;
  margin: 0 auto;
  padding: 2.25rem 10%;
  display: grid;
  gap: 1.6rem;
}

.services-header {
  display: grid;
  gap: 0.4rem;
  justify-items: center;
}

.eyebrow {
  margin-top: 32px;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(212, 161, 94, 0.92);
}

.lead {
  margin: 0.3rem 0 0;
  color: rgba(255, 220, 180, 0.72);
  font-size: 1.05rem;
}

.services-grid {
  display: grid;
  width: 100%;
  margin: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.75rem, 2vw, 2rem);
  justify-items: center;
}

.service-card {
  width: min(100%, 340px);
  height: min(100%, 520px);
  display: grid;
  align-content: start;
  gap: 0.85rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background: linear-gradient(rgba(10, 11, 13, 0.88));
  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.34),
    inset 0 0 0 1px rgba(212, 161, 94, 0.06);
}

.service-card-head {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 1.2rem 0 0;
  text-align: center;
  font-size: 1.2rem;
  color: rgba(255, 237, 214, 0.95);
}

.service-card {
  margin: 0;
  font-size: 1.2rem;
  color: rgba(255, 237, 214, 0.95);
  letter-spacing: 0.01em;
}

.card-image-slot {
  min-height: 220px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.card-image-slot span {
  font-size: 0.83rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-bullets {
  margin: 1.5rem;
  justify-self: center;
  display: block;
  padding: 0 0 0 1rem;
  display: grid;
  gap: 0.5rem;
  color: rgba(255, 220, 180, 0.8);
  font-size: 0.93rem;
  list-style-type: none;
}

@media (max-width: 980px) {
  .services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .services-page {
    padding: 1.35rem 0.8rem 2rem;
  }

  .services-grid {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }

  .service-card {
    min-height: auto;
    max-width: none;
  }

  .card-image-slot {
    min-height: 200px;
  }
}
</style>
