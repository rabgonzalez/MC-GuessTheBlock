<script lang="ts">
import { defineComponent, h, PropType } from "vue";
import { MessageKey } from "./en";
import { t } from "./index";

/**
 * A translated sentence with rich parts: each `{name}` placeholder is
 * replaced by the slot of the same name (a link, bold text...).
 *
 * <I18nText k="result.lostText"><template #block><b>Stone</b></template></I18nText>
 */
export default defineComponent({
  name: "I18nText",
  props: {
    /** Message key */
    k: { type: String as PropType<MessageKey>, required: true },
    /** Wrapping element */
    tag: { type: String, default: "span" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        props.tag,
        t(props.k)
          .split(/(\{\w+\})/)
          .filter(Boolean)
          .map((part) => {
            const slot = part.match(/^\{(\w+)\}$/)?.[1];
            return slot && slots[slot] ? slots[slot]?.() : part;
          })
      );
  },
});
</script>
