import { createApp } from "vue";
import App from "./App.vue";
import { mcTooltip } from "./modules/directives/mcTooltip";
import "./styles/main.css";

createApp(App).directive("mc-tooltip", mcTooltip).mount("#app");
