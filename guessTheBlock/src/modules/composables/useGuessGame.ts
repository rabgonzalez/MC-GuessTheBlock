import { computed, onMounted, ref } from "vue";
import { Block } from "../components/Block";
import axios from "axios";

export const useGuessGame = () => {
  const uri = "http://localhost:3000/blocks";
  const blocksAmmount = 1059;
  const searchedBlock = ref(null);
  const randomBlock = ref<Block | null>(null);

  async function fetchBlock() {
    try {
      const randomIndex: number = Math.floor(Math.random() * blocksAmmount);
      const response = await axios.get(uri + "/" + randomIndex);
      randomBlock.value = response.data;
    } catch (error) {
      console.log(error);
    }
  }
  
  onMounted(async () => {
    fetchBlock();
  });

  return {
    randomBlock,
    searchedBlock,
    fetchBlock,
  };
};
