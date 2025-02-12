import { computed, onMounted, ref } from "vue";
import { BlockAPI } from "../components/Block";
import { Block } from "../interfaces/block.interface";
import axios from "axios";

export const useGuessGame = () => {
  const uri = "http://localhost:3000/blocks";
  const blocksAmmount = 1059;
  const searchedBlocks = ref<Block[] | null>(null);
  const randomBlock = ref<Block | null>(null);

  async function fetchBlock() {
    try {
      const randomIndex: number = Math.floor(Math.random() * blocksAmmount);
      const response = await axios.get(uri + "/" + randomIndex);
      randomBlock.value = response.data;
      const data = (await axios.get(uri + "/" + id).data) as BlockAPI;
      const block: Block = {
        name: data.name,
        displayName: data.displayName,
        stackSize: data.stackSize,
        transparent: data.transparent,
        emitLight: data.emitLight,
        crossable: data.boundingBox === "empty",
        hardness: data.hardness,
        toolLevel: 0,
        tool: "data.tool",
        blastResistance: data.resistance,
      };
      randomBlock.value = block;
    } catch (error) {
      console.log(error);
    }
  }
  async function fetchBlocksByName(name: string) {
    try {
      const data = (await axios.get(uri + "&name_like=" + name)
        .data) as BlockAPI[];
      const blocks: Block[] = data.map((block: BlockAPI) => {
        return {
          name: block.name,
          displayName: block.displayName,
          stackSize: block.stackSize,
          transparent: block.transparent,
          emitLight: block.emitLight,
          crossable: block.boundingBox === "empty",
          hardness: block.hardness,
          toolLevel: 0,
          tool: "data.tool",
          blastResistance: block.resistance,
        };
      });
      searchedBlocks.value = blocks;
    } catch (error) {
      console.log(error);
    }
  }
  
  onMounted(async () => {
    fetchBlock();
  });

  return {
    randomBlock,
    searchedBlock: searchedBlocks,
    fetchBlock,
    fetchBlocksByName,
  };
};
