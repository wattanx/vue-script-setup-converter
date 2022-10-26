<script setup lang="ts">
import { defineComponent, toRefs, computed, ref } from "vue";
type Props = {
  msg: string;
  foo?: string;
};
const props = withDefaults(defineProps<Props>(), {
  msg: "HelloWorld",
});
const emit = defineEmits({ change: (value: number) => true });
emit("change", 124);

const { msg, foo } = toRefs(props);
const newMsg = computed(() => msg.value + "- HelloWorld");

const count = ref(0);
</script>
