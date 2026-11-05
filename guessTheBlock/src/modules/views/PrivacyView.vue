<template>
  <article
    class="mc-panel legal w-full max-w-2xl p-4 sm:p-6"
    aria-labelledby="privacy-title"
  >
    <h2 id="privacy-title" class="mb-4 text-center text-xl sm:text-2xl">
      Privacy
    </h2>

    <section>
      <h3>What we collect</h3>
      <p>
        Nothing. There are no accounts, no cookies, no analytics and no
        advertising, and the game never sends your guesses anywhere.
      </p>
    </section>

    <section>
      <h3>What stays on your device</h3>
      <p>
        Your daily progress (the blocks you guessed and whether you found the
        answer) is saved in your browser's local storage so you can come back
        later and see your stats. It never leaves your device and you can delete
        it at any time:
      </p>
      <p class="mt-3 flex flex-wrap items-center gap-3">
        <button class="mc-button" :disabled="saved === 0" @click="clear">
          Delete my progress
        </button>
        <span class="text-sm" role="status">
          {{
            cleared
              ? "Progress deleted."
              : `${saved} ${saved === 1 ? "day" : "days"} saved.`
          }}
        </span>
      </p>
    </section>

    <section>
      <h3>Hosting</h3>
      <p>
        The website is hosted on GitHub Pages. GitHub may log technical data
        such as your IP address to serve and protect the site; see the
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          target="_blank"
          rel="noopener"
          >GitHub Privacy Statement</a
        >.
      </p>
    </section>

    <section>
      <h3>Sharing</h3>
      <p>
        Sharing only happens when you press "Share on WhatsApp" or "Copy
        result". The text contains your result as coloured squares and a link to
        the game, nothing else. WhatsApp's own privacy policy applies to what
        you send there.
      </p>
    </section>

    <section>
      <h3>Credits</h3>
      <p>
        Made by
        <a href="https://github.com/JonayKB" target="_blank" rel="noopener"
          >Jonay Contreras Rodríguez</a
        >
        and
        <a href="https://github.com/rabgonzalez" target="_blank" rel="noopener"
          >Rubén Abreu González</a
        >. Block data from
        <a
          href="https://github.com/PrismarineJS/minecraft-data"
          target="_blank"
          rel="noopener"
          >minecraft-data</a
        >
        (PrismarineJS). Block textures and models belong to Mojang.
      </p>
      <p class="mt-2">
        Questions or problems? Open an issue on
        <a :href="REPO_URL" target="_blank" rel="noopener">GitHub</a>.
      </p>
    </section>

    <p class="mt-6 text-center">
      <a href="#/" class="mc-button">Back to the game</a>
    </p>
  </article>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { REPO_URL } from "../data/site";

const PREFIX = "guess-the-block:";

function savedKeys(): string[] {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  } catch {
    return [];
  }
}

const saved = ref(savedKeys().length);
const cleared = ref(false);

function clear() {
  if (!window.confirm("Delete all your saved progress?")) return;
  try {
    savedKeys().forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage unavailable: nothing was saved anyway.
  }
  saved.value = savedKeys().length;
  cleared.value = true;
}
</script>
