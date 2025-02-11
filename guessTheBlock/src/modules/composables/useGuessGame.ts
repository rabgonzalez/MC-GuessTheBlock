import { onMounted } from "vue"

export const useGuessGame = () => {
  let message: string = "";

  onMounted(() => {
    message = "loading";
  });

  return {
    message
  }
}
