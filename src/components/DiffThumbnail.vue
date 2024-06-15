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
      this.processRefactorings(leftColors, this.refactoringLeft, this.refactoringTypesLeft, 'low'); // low priority refactorings
      this.processRefactorings(leftColors, this.refactoringLeft, this.refactoringTypesLeft, 'medium'); // medium priority refactorings
      this.processIntervals(leftColors, this.modificationLeft, '#FBE251'); // yellow - modification
      this.processIntervals(leftColors, this.removal, '#FF0000'); // red - removal
      this.processRefactorings(leftColors, this.refactoringLeft, this.refactoringTypesLeft, 'high'); // high priority refactorings
      this.processIntervals(leftColors, this.microChangeLeft, '#B28FCE'); // purple - micro change

      // Handling right color assignments
      this.processRefactorings(rightColors, this.refactoringRight, this.refactoringTypesRight, 'low'); // low priority refactorings
      this.processRefactorings(rightColors, this.refactoringRight, this.refactoringTypesRight, 'medium'); // medium priority refactorings
      this.processIntervals(rightColors, this.modificationRight, '#FBE251'); // yellow - modification
      this.processIntervals(rightColors, this.addition, '#227D51'); // green - addition
      this.processRefactorings(rightColors, this.refactoringRight, this.refactoringTypesRight, 'high'); // high priority refactorings
      this.processIntervals(rightColors, this.microChangeRight, '#B28FCE'); // purple - micro change


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

    processRefactorings(colors, intervals, types, priority) {
      if (!intervals || intervals.length === 0) {
        return;
      }

      const intervalsByPriority = intervals.map((interval, idx) => {
        const type = types && types[idx] ? types[idx] : '';
        let priorityLevel;
        if (type.includes('Package') || type.includes('Class') || type.includes('Subclass') || type.includes('Superclass')) {
          priorityLevel = 'low';
        } else if (type.includes("Method") || type.includes("Parameter") || type.includes("Thrown") || type.includes("Interface")) {
          priorityLevel = 'medium';
        } else {
          priorityLevel = 'high';
        }
        return { interval, priorityLevel, type };
      });

      const filteredIntervals = intervalsByPriority.filter(item => item.priorityLevel === priority);
      const colorMap = {
        'low': '#81C7D4', // light blue
        'medium': '#33A6B8', // blue
        'high': '#0D5661' // dark blue
      };

      filteredIntervals.forEach(({ interval }) => {
        for (let i = interval[0]-1; i <= interval[1]-1; i++) {
          colors[i] = colorMap[priority];
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
