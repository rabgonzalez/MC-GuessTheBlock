import { onMounted, ref } from "vue";
import { BlockAPI, HarvestTools } from "../components/Block";
import { Block } from "../interfaces/block.interface";
import axios from "axios";

export const useGuessGame = () => {
  const uri = "http://localhost:3000/";
  const blocksAmmount = 1059;
  const searchedBlocks = ref<Block[] | null>(null);
  const randomBlock = ref<Block | null>(null);
  const selectedBlocks = ref<Block[] | null>(null);

  /**
   * Add a block to the selectedBlocks array
   * 
   * @param block Block to add to the selectedBlocks array
   */
  function addBlock(block: Block) {
    selectedBlocks.value?.push(block);
  }

  /**
   * Fetch a block from the API by its id
   * 
   * @param id Block id to fetch
   */
  async function fetchBlock(id: number) {
    try {
      const data = (await axios.get(uri + "blocks/" + id)).data as BlockAPI;
      let tool = "";
      if (data.harvestTools) {
        tool = await fetchItemName(
          getLowerTierTool(data.harvestTools ?? {}) ?? 0
        );
      } else {
        if (data.material && data.material.includes("/")) {
          tool = "wooden_" + data.material.split("/")[1];
        } else {
          tool = "none";
        }
      }
      const block: Block = {
        name: data.name,
        displayName: data.displayName,
        stackSize: data.stackSize,
        transparent: !data.transparent,
        emitLight: data.emitLight,
        crossable: data.boundingBox === "empty",
        hardness: data.hardness,
        tool: tool,
        blastResistance: data.resistance,
      };
      randomBlock.value = block;
      console.log(block.displayName);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Fetch the name of an item by its id
   * 
   * @param id Item id to fetch the name
   */
  async function fetchItemName(id: number) {
    try {
      const data = (await axios.get(uri + "items/" + id)).data;
      return data.name;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Fetch blocks from the API by their display name
   * 
   * @param displayName Display name of the blocks to fetch
   */
  async function fetchBlocksByName(displayName: string) {
    try {
      if (displayName === "") {
        searchedBlocks.value = [];
        return;
      }
      const data = (
        await axios.get(
          uri + "blocks?displayName_like=" + displayName + "&_limit=10"
        )
      ).data as BlockAPI[];
      const blocks: Block[] = await Promise.all(
        data.map(async (block: BlockAPI) => {
          let tool = "";
          if (block.harvestTools) {
            tool = await fetchItemName(
              getLowerTierTool(block.harvestTools ?? {}) ?? 0
            );
          } else {
            if (block.material && block.material.includes("/")) {
              tool = "wooden_" + block.material.split("/")[1];
            } else {
              tool = "none";
            }
          }
          return {
            name: block.name,
            displayName: block.displayName,
            stackSize: block.stackSize,
            transparent: !block.transparent,
            emitLight: block.emitLight,
            crossable: block.boundingBox === "empty",
            hardness: block.hardness,
            tool: tool,
            blastResistance: block.resistance,
          };
        })
      );
      searchedBlocks.value = blocks;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Get the lower tier tool from a block
   * 
   * @param tools Block tools
   */
  function getLowerTierTool(tools: HarvestTools): number | null {
    const toolNumbers = Object.keys(tools)
      .map(Number)
      .sort((a, b) => a - b);

    for (const num of toolNumbers) {
      if (tools[num.toString() as unknown as keyof HarvestTools]) {
        return num;
      }
    }
    return null;
  }

  onMounted(async () => {
    selectedBlocks.value = [
      {
        name: "air",
        displayName: "Air",
        stackSize: 64,
        transparent: false,
        emitLight: 0,
        crossable: true,
        hardness: 0,
        tool: "none",
        blastResistance: 0,
      } as Block,
    ];
    const randomIndex: number = Math.floor(Math.random() * blocksAmmount);
    fetchBlock(randomIndex);
  });

  return {
    randomBlock,
    selectedBlocks,
    searchedBlocks,
    fetchBlock,
    fetchBlocksByName,
    addBlock,
  };
};
