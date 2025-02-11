import { onMounted } from "vue";

export const useGuessGame = () => {
  let message = "";

  onMounted(() => {
    message = "loading";
  });

  return {
    message,
  };
};
