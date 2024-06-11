<template>
  <div :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'start', width: '100%', padding: '20px' }">
    <!-- Left Blocks Container -->
    <div :style="{ height: leftHeight + 'px', width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '5px' }">
      <div v-for="(block, index) in leftblocks" :key="index" :style="{ width: '50px', height: block.width + 'px', backgroundColor: block.color }">&nbsp;</div>
    </div>
    <!-- Right Blocks Container -->
    <div :style="{ height: rightHeight + 'px', width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '0px' }">
      <div v-for="(block, index) in rightblocks" :key="index" :style="{ width: '50px', height: block.width + 'px', backgroundColor: block.color }">&nbsp;</div>
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
    refactoringRight: Array,
    refactoringTypesLeft: Array,
    refactoringTypesRight: Array
  },
  data() {
    return {
      leftblocks: [],
      rightblocks: []
    };
  },
  methods: {
    mergeIntervals() {
      const leftColors = new Array(this.leftHeight + 1).fill('#BDC0BA'); // grey
      const rightColors = new Array(this.rightHeight + 1).fill('#BDC0BA'); // grey

      // Handling left color assignments
      this.processIntervals(leftColors, this.modificationLeft, '#FBE251'); // yellow
      this.processIntervals(leftColors, this.removal, '#FF0000'); // red
      this.processRefactorings(leftColors, this.refactoringLeft, this.refactoringTypesLeft); // refactorings
      this.processIntervals(leftColors, this.microChangeLeft, '#B28FCE'); // purple

      // Handling right color assignments
      this.processIntervals(rightColors, this.modificationRight, '#FBE251'); // yellow
      this.processIntervals(rightColors, this.addition, '#227D51'); // green
      this.processRefactorings(rightColors, this.refactoringRight, this.refactoringTypesRight); // refactorings
      this.processIntervals(rightColors, this.microChangeRight, '#B28FCE'); // purple

      this.leftblocks = this.createBlocks(leftColors, this.leftHeight);
      this.rightblocks = this.createBlocks(rightColors, this.rightHeight);
    },

    processIntervals(colors, intervals, defaultColor) {
      if (!intervals || intervals.length === 0) {
        return;
      }
      intervals.forEach(interval => {
        for (let i = interval[0]; i <= interval[1]; i++) {
          colors[i] = defaultColor;
        }
      });
    },

    processRefactorings(colors, intervals, types) {
      if (!intervals || intervals.length === 0) {
        return;
      }

      // Separate intervals by type priority
      const highPriorityIntervals = [];
      const mediumPriorityIntervals = [];
      const lowPriorityIntervals = [];

      intervals.forEach((interval, idx) => {
        const type = types && types[idx] ? types[idx] : '';
        if(type.includes('Package') || type.includes('Class') || type.includes('subClass')){
          lowPriorityIntervals.push({ interval, type });
        } else if (type.includes("Method") || type.includes("Parameter") || type.includes("Thrown") || type.includes("Interface")){
          mediumPriorityIntervals.push({ interval, type });
        } else {
          highPriorityIntervals.push({ interval, type });
        }
      });

      // Apply colors in reverse priority to ensure layering
      this.applyRefactoringColors(colors, lowPriorityIntervals, '#81C7D4'); // light blue
      this.applyRefactoringColors(colors, mediumPriorityIntervals, '#33A6B8'); // blue
      this.applyRefactoringColors(colors, highPriorityIntervals, '#0D5661'); // dark blue
    },

    applyRefactoringColors(colors, intervals, color) {
      intervals.forEach(({ interval }) => {
        for (let i = interval[0]; i <= interval[1]; i++) {
          colors[i] = color;
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
