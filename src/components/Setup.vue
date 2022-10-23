<script lang="ts">
import { defineComponent, toRefs, computed, ref } from "vue";

export default defineComponent({
  name: "HelloWorld",
  props: {
    msg: {
      type: String,
      required: true,
      default: "HelloWorld",
    },
    foo: {
      type: String,
    },
  },
  setup(props, ctx) {
    const { msg, foo } = toRefs(props);
    const newMsg = computed(() => msg.value + "- HelloWorld");

    ctx.emit("change", 124);

    const count = ref(0);

    return {
      count,
      newMsg,
    };
  },
});
</script>
