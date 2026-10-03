import { createApp } from "vue"
import "./style.css"
import App from "./App.vue"
import router from "./router.js"
import timescan from "@/directives/timescan"
import { initEnquiryTracking } from "./utils/enquiryTracking.js"

if (import.meta.env.PROD) initEnquiryTracking()

const app = createApp(App)
app.use(router)
app.directive("timescan", timescan)
app.mount("#app")
