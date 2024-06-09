  <template>
    <div :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'start', width: '100%', padding: '20px' }">
      <!-- Left Blocks Container -->
      <div :style="{ height: leftHeight + 'px', width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '5px' }">
        <div v-for="(block, index) in leftblocks" :key="index" :style="{ width: '50px', height: block.width + 'px', backgroundColor: block.color}">&nbsp;</div>
      </div>
      <!-- Right Blocks Container -->
      <div :style="{ height: rightHeight + 'px', width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '0px' }">
        <div v-for="(block, index) in rightblocks" :key="index" :style="{ width: '50px', height: block.width + 'px', backgroundColor: block.color}">&nbsp;</div>
      </div>
    </div>
  </template>

  <script>
export default {
  props: {
    leftHeight: Number,
    rightHeight: Number,
    addition: Array,
    removal: Array,
    modificationLeft: Array,
    modificationRight: Array,
    microChangeLeft: Array,
    microChangeRight: Array,
    refactoringLeft: Array,
    refactoringRight: Array
  },
  data() {
    return {
      leftblocks: [],
      rightblocks: []
    };
  },
  methods: {
    mergeIntervals() {
      const leftColors = new Array();
      for(let i =0;i<this.leftHeight + 1;i++){
        leftColors.push('grey');
      }
      const rightColors = new Array(75 + 1).fill('grey');
      for(let i =0;i<this.rightHeight + 1;i++){
        rightColors.push('grey');
      }

      // Handling left color assignments
      this.processIntervals(leftColors, this.modificationLeft, 'yellow');
      this.processIntervals(leftColors, this.removal, 'red');
      this.processIntervals(leftColors, this.refactoringLeft, 'blue');
      this.processIntervals(leftColors, this.microChangeLeft, 'purple');

      // Handling right color assignments
      this.processIntervals(rightColors, this.modificationRight, 'yellow');
      this.processIntervals(rightColors, this.addition, 'green');
      this.processIntervals(rightColors, this.refactoringRight, 'blue');
      this.processIntervals(rightColors, this.microChangeRight, 'purple');

      this.leftblocks = this.createBlocks(leftColors, this.leftHeight);
      this.rightblocks = this.createBlocks(rightColors, this.rightHeight);
    },

    processIntervals(colors, intervals, color, conditionalColor = null) {
      if (!intervals || intervals.length === 0) {
          return;
        }
      intervals.forEach(interval => {
        for (let i = interval[0]; i <= interval[1]; i++) {
          if (!conditionalColor || colors[i] === conditionalColor) {
            colors[i] = color;
          }
        }
      });
    },

    createBlocks(colors, length) {
      let blocks = [];
      let currentColor = colors[1];
      let start = 1;
      for (let i = 1; i <= length; i++) {
        if (colors[i] !== currentColor) {
          blocks.push({
            width: i - start,
            color: currentColor
          });
          currentColor = colors[i];
          start = i;
        }
      }
      // Push the last block
      if (start <= length) {
        blocks.push({
          width: length + 1 - start,
          color: currentColor
        });
      }
      return blocks;
    }
  },
  mounted() {
    this.mergeIntervals();
  }
}
</script>

  
  <style scoped>
.rectangle-top,
.rectangle-bottom {
  transition: all 0.3s ease;
}
  </style>
  