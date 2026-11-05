<template>
  <footer class="site-footer mc-shadow mt-auto max-w-xl text-center">
    <nav
      class="flex flex-wrap justify-center gap-x-4 gap-y-1"
      :aria-label="t('footer.privacy')"
    >
      <a :href="REPO_URL" target="_blank" rel="noopener">GitHub</a>
      <a href="#/privacy">{{ t("footer.privacy") }}</a>
    </nav>
    <p>
      © {{ year }}
      <a href="https://github.com/JonayKB" target="_blank" rel="noopener"
        >Jonay Contreras Rodríguez</a
      >
      &amp;
      <a href="https://github.com/rabgonzalez" target="_blank" rel="noopener"
        >Rubén Abreu González</a
      >. {{ t("footer.rights") }}
    </p>
    <p class="opacity-75">
      NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH
      MOJANG OR MICROSOFT.
    </p>
  </footer>
</template>

<script setup lang="ts">
import { REPO_URL } from "../data/site";
import { t } from "../i18n";

const year = new Date().getFullYear();
</script>
